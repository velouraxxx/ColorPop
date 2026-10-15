import {createClient} from '@supabase/supabase-js';
import {getChatGPTUser} from '../../chatgpt-auth';
import {config} from '../../../lib/colorpop/runtime';
import {buildRequest,extractText,actions} from '../../../lib/colorpop/chat.mjs';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(req:Request){
 try{
  if(!await getChatGPTUser())return fail('Sign in to ColorPop first.',401);
  const c=config();if(!c.url||!c.key)return fail('Cloud saving is not configured.',503);
  const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return fail('Sign in to your story account in Settings.',401);
  const db=createClient(c.url,c.key,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}});
  const {data:auth,error:authError}=await db.auth.getUser(token);if(authError||!auth.user)return fail('Your story-account session expired. Sign in again in Settings.',401);
  if(auth.user.is_anonymous)return fail('Use an email account to receive AI replies.',403);
  const secret=c.openrouterKey||c.openaiKey;if(!secret)return fail('No AI API key is configured in the hosting settings.',503);
  const raw=await req.text();if(raw.length>16000)return fail('The request is too large.',413);
  let input;try{input=JSON.parse(raw)}catch{return fail('The chat request is not valid JSON.')}
  const {chatId,speaker,action='reply'}=input;
  if(typeof chatId!=='string'||typeof speaker!=='string'||!Object.hasOwn(actions,action))return fail('Choose a valid chat, character and action.');
  const {data:chat,error}=await db.from('colorpop_items').select('*').eq('id',chatId).eq('kind','Chat').single();
  if(error||!chat)return fail('This chat could not be found in your cloud account. Save or import it first.',404);
  const ids=[...(chat.data.characterIds||[]),...(chat.data.lorebookIds||[]),chat.data.personaId].filter(Boolean);
  const related=ids.length?await db.from('colorpop_items').select('*').in('id',ids):{data:[],error:null};if(related.error)return fail('Could not load the character details. Your message is saved; retry later.',503);
  const rows=related.data||[],characters=rows.filter(x=>x.kind==='Character');
  if(speaker!=='narrator'&&!characters.some(x=>x.id===speaker))return fail('Select a character who is in this chat.');
  const request=buildRequest(chat,characters,rows.find(x=>x.kind==='Persona'),rows.filter(x=>x.kind==='Lorebook'),speaker,action,c.openaiModel);
  const {data:allowed,error:limitError}=await db.rpc('colorpop_take_turn');if(limitError)return fail('The daily usage check is unavailable. Try again later.',503);if(!allowed)return fail('Your daily limit of 100 AI requests has been reached. It resets at midnight UTC.',429);
  const router=!!c.openrouterKey;
  const body=router?{...(c.openrouterModel?{model:c.openrouterModel}:{}),max_tokens:1000,messages:[{role:'system',content:request.instructions},...request.input]}:request;
  const response=await fetch(router?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json',...(router?{'X-OpenRouter-Title':'ColorPop'}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});
  if(!response.ok){const errors:Record<number,string>={401:'The AI provider rejected the API key. Replace it in the hosting secret settings.',402:'The AI provider reports insufficient credit. Check your provider balance.',403:'The provider denied this request. Check model access or content restrictions.',404:'The selected AI model is unavailable. Check the configured model.',429:'The provider rate limit was reached. Wait briefly and retry.'};return fail(errors[response.status]||'The AI provider is having trouble answering. Your message is saved; try again.',response.status===429?429:502)}
  const output=await response.json();if(output.error)return fail('The provider returned an error instead of a reply. Check your model and account.',502);
  const text=router?output.choices?.[0]?.message?.content:extractText(output);
  if(typeof text!=='string'||!text.trim())return fail('The provider returned an empty reply. Your message is saved; retry.',502);
  return Response.json({content:text,name:speaker==='narrator'?'Narrator':characters.find(x=>x.id===speaker)!.data.name},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return fail(e instanceof Error&&e.name==='TimeoutError'?'The AI request timed out. Your message is saved; retry the reply.':'The connection failed before a reply arrived. Your message is saved; retry.',502)}
}

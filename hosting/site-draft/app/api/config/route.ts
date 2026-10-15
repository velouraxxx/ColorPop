import {config} from '../../../lib/colorpop/runtime';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Sign in to ColorPop.'},{status:401});const c=config();return Response.json({url:c.url,key:c.key,aiReady:!!(c.openrouterKey||c.openaiKey),provider:c.openrouterKey?'OpenRouter':'OpenAI'},{headers:{'Cache-Control':'no-store'}})}

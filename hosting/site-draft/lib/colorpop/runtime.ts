import {env} from 'cloudflare:workers';
export function config(){const e=env as unknown as Record<string,string|undefined>;return {url:e.SUPABASE_URL,key:e.SUPABASE_PUBLISHABLE_KEY,openrouterKey:e.OPENROUTER_API_KEY,openrouterModel:e.OPENROUTER_MODEL,openaiKey:e.OPENAI_API_KEY,openaiModel:e.OPENAI_MODEL||'gpt-4.1-mini'}}

# Hosting work checkpoint — October 15, 2026

This folder preserves the in-progress ChatGPT Sites / Cloudflare port. The working Node app remains at the repository root.

Included: matching chat and character screens, Supabase persistence, server-only OpenRouter support with OpenAI fallback, and more specific provider error messages. Secrets are not included.

This port is NOT deployed or build-verified yet. The starter dependency install completed, but @supabase/supabase-js@2.117.3 and react-router-dom@7.18.4 still need to be added and the lockfile updated. Copy the repository root public/assets folder into this folder's public/assets before building. Sites project identity and runtime files are intentionally excluded; deployment requires the managed Sites environment.

Required environment: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and OPENROUTER_API_KEY (or OPENAI_API_KEY). Optional OPENROUTER_MODEL / OPENAI_MODEL. The hosted route uses the existing colorpop_take_turn Supabase RPC for its daily limit. Live provider replies and user sign-in still need verification.

Chat supports Continue, speaker selection, Generate / retry reply, retry saving replies, and favorites. Edit/resend, message deletion, replacement regeneration and a full diagnostic panel are not implemented.

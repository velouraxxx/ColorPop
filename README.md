# ColorPop

A mobile-first roleplay app built from Jasmine's saved ColorPop homepage and build guide, reskinned with the exact supplied palette. Midnight navy, cobalt, azure, hot pink, coral, orchid and mint; no yellow or amber accents.

## Open it in Codespaces

Create a Codespace on `feature/colorpop-chat-characters`. The dev container installs dependencies, creates `.env` from `.env.example`, and starts the app. Open forwarded port **5173**.

Manual setup (Node 24):

```sh
npm ci
cp .env.example .env
npm run dev
```

The existing Supabase project's public URL and publishable key are already in `.env.example`. These are client-safe connection values; access to records is restricted by Supabase authentication and ownership policies. No secret keys are committed.

## Enable OpenAI replies

Set **OPENAI_API_KEY** as a Codespaces secret or in the ignored server `.env`, then restart `npm run dev`. Do not enter the key in frontend code. `OPENAI_MODEL` is configurable; its starter value is `gpt-4.1-mini`. An API account with access to the selected model and API billing is required.

Sign in through **Settings** with an email account in this Supabase project. You can also create an account there; if email confirmation is enabled, confirm the email before signing in. Guest stories stay on the device. After signing in, **Import stories from this device** copies them to the cloud. Existing cloud IDs are skipped, never overwritten by import.

## Implemented

- Saved-homepage layout and hero artwork, semantic interactive controls, shared exact-color palette.
- Character creation/editing: portrait, name, age, ethnicity, height, body type, eye color, hair color/style, scars/marks, tattoos, personality, spouse, love interest, current address and vehicle, plus voice, wardrobe, starting scene and opening message.
- Likes and dislikes fill automatically from explicit attributed chat statements; editable entries, source quotes, and a learning toggle. Ambiguous and contradictory statements are skipped. This works in device mode as well as cloud mode. It does not infer unstated preferences.
- Persona and lorebook creation/editing; attach them when creating a chat.
- Full chat screen with selectable speaker bubbles, narrator, and Auto room (one rotating character reply per turn).
- Narrator actions: Continue, Add chaos, Describe scene, Plan next.
- Authenticated Supabase saving for characters, chats, personas, lorebooks and notes.
- Device-only guest mode, explicit save status, save-error messages, optimistic concurrency checks for cloud updates.
- Saved messages, search, pin/archive/restore chats, story notes, JSON backup download.
- Server-only OpenAI Responses API integration. Server verifies Supabase sessions and retrieves only owned chat/context rows. Anonymous auth sessions cannot use OpenAI. Rate limit: 12 requests/minute/account/process.
- Mobile navigation, safe-area padding, keyboard focus, reduced-motion support.

## Persistence and context

The app uses the project's existing `public.colorpop_items` table. Each record has an owner, kind, JSON data and timestamp. Its existing `colorpop_owner` RLS policy restricts SELECT/INSERT/UPDATE/DELETE to `auth.uid() = user_id`. The app never uses a service-role key. Portraits are limited to 350 KB and stored inside character data; the table enforces a 2 MB record limit.

Chat messages are saved before an AI request. A failed reply can be retried without resending the user message. If a generated reply fails to save, it remains visible with a save-retry button while that screen remains open. OpenAI receives the selected character profiles, persona, lorebooks, scene, and latest 60 messages. Portrait image data is excluded. This is bounded context, not unlimited automatic memory. Replies use `store: false`.

Device storage is separate from cloud accounts. Signing out returns to the device-only workspace. Device storage can be lost if browser data is cleared; use cloud saving or download a backup. Cloud writes are explicit per action, not background cross-device live collaboration. Conflicting cloud edits ask the user to refresh.

## Run and validate

```sh
npm run build
npm test
npx playwright install chromium --only-shell
npm run test:ui
```

UI tests start a production server on port 3002 and exercise character creation, chat creation, message saving, bookmarking, reload persistence, and width checks at 375/390/430/1280 px. Server tests exercise prompt context, response extraction, and unauthenticated endpoint rejection. `node scripts/screenshots.mjs` recreates the previews with clearly marked demo content.

## Deployment

This is a full-stack Node app; a static GitHub Pages deployment alone cannot run the protected OpenAI endpoint. Build with `npm ci && npm run build`, then run `npm start` on a Node host with the environment variables configured. The server serves both the built app and `/api` routes. Use HTTPS in production. For multiple server replicas, replace the in-memory rate limiter with a shared store and set an API spending limit. Confirm Supabase email redirect URLs for the deployed origin.

## Status and limits

Source is published on the feature/colorpop-chat-characters branch. A permanent hosted app is not deployed yet.

The app has been implemented and tested locally; it is not deployed to a permanent public hosting URL. OpenAI live output is not tested until a server API key is supplied. Database insert/update and cross-account read isolation were verified in a rolled-back Supabase transaction; no test users or records remain. Full browser sign-in/cloud-save testing with the user's actual account remains to be done after launch.

The original source homepage is preserved in the supplied ZIP; its decorative hero is retained. The active exact theme is in `src/palette.css`; Golden Amber is intentionally excluded according to the no-yellow instruction. Secondary screens share the same tokens. See `docs/previews` for actual app renders.

3D relationship maps/timelines, image generation, plugins, streaming, deletion, password reset, and JSON backup restoration are not implemented in this increment. No unavailable feature is presented as live functionality.

## Memory and plugins update

The first per-chat memory, instruction-plugin and CSS 3D timeline implementation is available. See [setup and limitations](docs/MEMORY_PLUGINS.md). This supersedes the earlier statement that plugins and timelines are entirely unimplemented. Hosting is still pending.

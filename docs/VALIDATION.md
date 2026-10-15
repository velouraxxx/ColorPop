# Validation — 2026-10-15

- TypeScript and Vite production build pass.
- Seven Node tests pass, including explicit preference attribution, user/character separation, duplicate prevention, contradiction handling and disabling learning. Original tests cover: bounded character context excluding portrait bytes; Responses API text/refusal extraction; 401 rejection without a session and no OpenAI key in public configuration.
- The original five browser tests passed before the expanded character form was added. The new sixth test covers the added fields and chat-learned preference persistence, but its browser rerun was blocked because the browser download was unavailable. Original passing coverage: character/chat/message/bookmark reload persistence and layout overflow checks at 375, 390, 430 and 1280 pixels.
- Supabase live test in a rolled-back transaction: synthetic user A inserted and updated a ColorPop character; user B could see zero matching rows. No test data persisted.
- Existing ownership policy has both USING and WITH CHECK tied to auth.uid(). Existing schema and Afterglow backup were not changed.
- Security advisor reports pre-existing notices for anonymous-account policies, an existing security-definer rate function, its private usage table, and disabled leaked-password protection. This implementation does not use the existing rate function and refuses anonymous AI requests. No claim is made that the whole shared project has been security-audited.
- OpenAI key is absent. Live generation, actual-user email sign-in, and hosted deployment have not been tested.
- Screen renders use clearly marked local demo content, not actual saved chats.

References used for implementation:

- https://developers.openai.com/api/docs/quickstart
- https://supabase.com/docs/reference/javascript/auth-signinwithpassword
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

The previews show the verified reskin before the expanded character form. The source contains the additional fields; refreshed character screenshots are pending a browser rerun.

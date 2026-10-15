# Memory, plugins and timeline — first version

Inside a chat, open **Chat setup · Memory · 3D timeline**.

- Select characters, one user persona, and up to four lorebooks.
- Create up to five per-chat instruction plugins. Enable/disable, edit or delete each. These are prompt instructions, not executable third-party plugins or automatic LoreBerry imports.
- Click Remember beside a message, or add a memory manually. Review/edit its title, story time, type and details. Memories are stored in the existing chat record, using device storage for guests and Supabase for signed-in users.
- Rotate and zoom the CSS 3D timeline using sliders; tap cards for details. An accessible ordered list is also available. Order is saved order, not automatic fictional date sorting.
- Up to 100 memories per chat; the latest 30 enter AI context, plus enabled plugins and up to four lorebooks. Existing message context remains bounded to 60 messages. This is reviewed memory, not automatic comprehensive extraction or a relationship graph.

Validation: production build and all eight Node tests pass, including memory/plugin inclusion and disabled-plugin exclusion. New browser interactions and live AI generation have not been verified. Hosting remains an unfinished draft; this commit does not deploy a live app.

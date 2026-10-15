import { spawn } from "node:child_process";
import { once } from "node:events";
import test from "node:test";
import assert from "node:assert/strict";
import { buildRequest, extractText } from "../server/chat.mjs";
test("context keeps character voice, excludes portraits and bounds chat history", () => {
  const chat = {
    data: {
      messages: Array.from({ length: 100 }, () => ({
        role: "user",
        name: "Emmy",
        content: "Hello",
      })),
      scenario: "Miami",
    },
  };
  const c = {
    id: "lucious",
    data: { name: "Lucious", voice: "Quiet", avatar: "DO-NOT-SEND" },
  };
  const r = buildRequest(chat, [c], null, [], "lucious", "reply", "example");
  assert.equal(r.input.length, 61);
  assert.equal(r.store, false);
  assert.match(r.instructions, /Quiet/);
  assert.doesNotMatch(r.instructions, /DO-NOT-SEND/);
  assert.throws(() =>
    buildRequest(chat, [c], null, [], "other", "reply", "example"),
  );
});
test("Responses API text and refusals are surfaced", () => {
  assert.equal(
    extractText({
      output: [{ content: [{ type: "output_text", text: "Hello" }] }],
    }),
    "Hello",
  );
  assert.equal(
    extractText({
      output: [{ content: [{ type: "refusal", refusal: "Cannot help" }] }],
    }),
    "Cannot help",
  );
});
test("API rejects unauthenticated requests and never exposes OpenAI secrets", async () => {
  const server = spawn(process.execPath, ["server/index.mjs"], {
    env: { ...process.env, PORT: "3002", OPENAI_API_KEY: "" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  try {
    await once(server.stdout, "data");
    const r = await fetch("http://127.0.0.1:3002/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(r.status, 401);
    const c = await (await fetch("http://127.0.0.1:3002/api/config")).json();
    assert.equal(c.aiReady, false);
    assert.equal(c.OPENAI_API_KEY, undefined);
  } finally {
    server.kill();
  }
});
test('chat context includes reviewed memory and enabled plugins, caps lorebooks', () => {
 const chat={data:{messages:[],memories:[{title:'Promise',detail:'Meet at the station',storyTime:'Day 2',kind:'event'}],plugins:[{name:'Tone',instructions:'Use short paragraphs',enabled:true},{name:'Off',instructions:'DISABLED_PLUGIN_SENTINEL',enabled:false}]}};
 const r=buildRequest(chat,[],null,Array.from({length:5},(_,i)=>({data:{name:`LORE_SENTINEL_${i}`}})),'narrator','reply','example');
 assert.match(r.instructions,/Meet at the station/);
 assert.match(r.instructions,/Use short paragraphs/);
 assert.doesNotMatch(r.instructions,/DISABLED_PLUGIN_SENTINEL|LORE_SENTINEL_4/);
});

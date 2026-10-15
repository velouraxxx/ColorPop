import test from "node:test";
import assert from "node:assert/strict";
import { learnPreferences } from "../src/preferences.ts";
const msg = (content, role = "assistant", name = "Lucious") => ({
  id: "1",
  content,
  role,
  name,
  createdAt: "",
});
test("learns character likes and dislikes; preserves manual values", () => {
  const d = learnPreferences({ name: "Lucious", likes: "Cars" }, [
    msg("I love coffee. I hate crowds."),
  ]);
  assert.equal(d.likes, "Cars\ncoffee");
  assert.equal(d.dislikes, "crowds");
  assert.equal(d.preferenceSources.length, 2);
});
test("does not confuse user or another character first person preferences", () => {
  const d = { name: "Lucious" };
  assert.equal(
    learnPreferences(d, [
      msg("I like coffee.", "user", "Emmy"),
      msg("I love music.", "assistant", "Emmy"),
    ]),
    d,
  );
});
test("learns named statements, ignores hypotheticals, questions and contradictions", () => {
  const d = learnPreferences({ name: "Lucious", dislikes: "coffee" }, [
    msg("Lucious likes cars.", "user", "Emmy"),
    msg("I like coffee. I like tea? If I like rain, I stay outside."),
  ]);
  assert.equal(d.likes, "cars");
  assert.equal(d.dislikes, "coffee");
});
test("disabled learning and duplicate statements leave data unchanged", () => {
  const disabled = { name: "Lucious", learnPreferences: false };
  assert.equal(learnPreferences(disabled, [msg("I love cars.")]), disabled);
  const d = { name: "Lucious", likes: "Cars" };
  assert.equal(learnPreferences(d, [msg("I love cars.")]), d);
});

import type { Data, Message } from "./types";
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const key = (s: string) => s.trim().toLocaleLowerCase();
/** Learn only explicit, attributed preference statements. Never assign user "I" to a character. */
export function learnPreferences(data: Data, messages: Message[]): Data {
  if (data.learnPreferences === false) return data;
  const likes = (data.likes || "").split("\n").filter(Boolean),
    dislikes = (data.dislikes || "").split("\n").filter(Boolean);
  const memory = [...(data.preferenceSources || [])];
  let changed = false;
  for (const m of messages) {
    const own = m.role === "assistant" && m.name === data.name;
    const subject = own ? `(?:${escape(data.name)}|I)` : escape(data.name);
    // Sentence/quotation boundaries deliberately exclude hypotheticals, reported speech and questions.
    const re = new RegExp(
      `(?:^|[.!?\\n“”"*])\\s*${subject}\\s+(likes?|loves?|enjoys?|prefers?|dislikes?|hates?|can(?:not|'t|’t) stand|don(?:'t|’t) like|doesn(?:'t|’t) like)\\s+([^.!?\\n“”"*]{1,160})(?=([.!?\\n“”"*]|$))`,
      "gi",
    );
    for (const match of m.content.matchAll(re)) {
      if (match[3] === "?") continue;
      const value = match[2].trim().replace(/[,;:]$/, "");
      if (
        !value ||
        /\b(if|would|might|maybe|perhaps|but|unless|used to)\b/i.test(value)
      )
        continue;
      const negative = /^(dislike|hate|can|don|doesn)/i.test(match[1]);
      const target = negative ? dislikes : likes,
        opposite = negative ? likes : dislikes;
      // Preserve manual entries and do not resolve contradictory story facts without the user.
      if (
        target.some((x) => key(x) === key(value)) ||
        opposite.some((x) => key(x) === key(value)) ||
        target.length >= 100
      )
        continue;
      target.push(value);
      memory.push({
        kind: negative ? "dislike" : "like",
        value,
        messageId: m.id,
        quote: match[0].trim(),
      });
      changed = true;
    }
  }
  return changed
    ? {
        ...data,
        likes: likes.join("\n"),
        dislikes: dislikes.join("\n"),
        preferenceSources: memory.slice(-100),
      }
    : data;
}

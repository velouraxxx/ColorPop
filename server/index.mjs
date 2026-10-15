import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { createClient } from "@supabase/supabase-js";
import { buildRequest, extractText, actions } from "./chat.mjs";
import path from "node:path";
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
const url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_PUBLISHABLE_KEY;
app.get("/api/config", (_req, res) =>
  res.json({ url, key, aiReady: !!process.env.OPENAI_API_KEY }),
);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
const limiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.user.id,
  message: { error: "Please wait a minute before another AI reply." },
});
app.post(
  "/api/chat",
  async (req, res, next) => {
    try {
      if (!url || !key)
        return res.status(503).json({ error: "Supabase is not configured." });
      const token = req.headers.authorization?.replace(/^Bearer /, "");
      if (!token)
        return res.status(401).json({ error: "Sign in to use OpenAI." });
      const db = createClient(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user)
        return res
          .status(401)
          .json({ error: "Your session expired. Sign in again." });
      if (data.user.is_anonymous)
        return res
          .status(403)
          .json({ error: "Create an email account to use OpenAI." });
      req.user = data.user;
      req.db = db;
      next();
    } catch {
      res
        .status(503)
        .json({ error: "Unable to verify your session. Try again." });
    }
  },
  limiter,
  async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY)
        return res
          .status(503)
          .json({
            error:
              "OpenAI is not connected yet. Add OPENAI_API_KEY to the server environment.",
          });
      const { chatId, speaker, action = "reply" } = req.body;
      if (
        typeof chatId !== "string" ||
        typeof speaker !== "string" ||
        !Object.hasOwn(actions, action)
      )
        return res.status(400).json({ error: "Invalid chat request." });
      const { data: chat, error } = await req.db
        .from("colorpop_items")
        .select("*")
        .eq("id", chatId)
        .eq("kind", "Chat")
        .single();
      if (error || !chat)
        return res.status(404).json({ error: "Chat not found." });
      const ids = [
        ...(chat.data.characterIds || []),
        ...(chat.data.lorebookIds || []),
        chat.data.personaId,
      ].filter(Boolean);
      const related = ids.length
        ? await req.db.from("colorpop_items").select("*").in("id", ids)
        : { data: [] };
      if (related.error) throw related.error;
      const rows = related.data,
        characters = rows.filter((x) => x.kind === "Character");
      const body = buildRequest(
        chat,
        characters,
        rows.find((x) => x.kind === "Persona"),
        rows.filter((x) => x.kind === "Lorebook"),
        speaker,
        action,
        process.env.OPENAI_MODEL || "gpt-4.1-mini",
      );
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
      if (!response.ok)
        return res
          .status(response.status === 429 ? 429 : 502)
          .json({
            error:
              response.status === 429
                ? "OpenAI quota or rate limit reached. Check API billing or try later."
                : "OpenAI could not complete the reply. Check the server model and API key.",
          });
      const output = await response.json();
      const content = extractText(output);
      if (!content)
        throw new Error("OpenAI returned an empty reply. Please retry.");
      res.json({
        content,
        name:
          speaker === "narrator"
            ? "Narrator"
            : characters.find((c) => c.id === speaker).data.name,
      });
    } catch (e) {
      res
        .status(502)
        .json({
          error:
            e.name === "TimeoutError"
              ? "OpenAI timed out. Your message is saved; retry the reply."
              : e.message || "Could not generate a reply.",
        });
    }
  },
);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Unknown endpoint." }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
app.use((err, _req, res, _next) =>
  res
    .status(err.status || 500)
    .json({
      error:
        err.status === 413
          ? "Request too large."
          : "Request could not be processed.",
    }),
);
app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log("ColorPop API ready"),
);

import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";
const server = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, PORT: "3002", NODE_ENV: "production" },
  stdio: ["ignore", "pipe", "inherit"],
});
let browser;
try {
  await once(server.stdout, "data");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  await page.goto("http://127.0.0.1:3002/");
  await page
    .getByRole("status")
    .filter({ hasText: "Saved on this device" })
    .waitFor();
  await page.screenshot({
    path: "docs/previews/home-mobile.png",
    fullPage: true,
  });
  await page.goto("http://127.0.0.1:3002/characters/new");
  await page.getByLabel("Name", { exact: true }).fill("Lucious · demo");
  await page
    .getByLabel("About", { exact: true })
    .fill("A confident fighter with a soft spot for Emmy.");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Protective, observant, quietly playful.");
  await page
    .getByLabel("Speaking style")
    .fill("Direct and warm, with a teasing edge.");
  await page
    .getByLabel("First message")
    .fill(
      "The city lights shimmer beyond the windows. “There you are,” he says, turning toward you.",
    );
  await page.screenshot({
    path: "docs/previews/character-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save Character", exact: true })
    .click();
  await page.goto("http://127.0.0.1:3002/chats/new");
  await page.getByRole("button", { name: "Lucious · demo" }).click();
  await page.getByLabel("Chat name").fill("Penthouse · demo");
  await page.getByRole("button", { name: "Enter the chat" }).click();
  await page.getByLabel("Your message").fill("I smile and step into the room.");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByRole("button", { name: "Dismiss notice" }).click();
  await page.screenshot({
    path: "docs/previews/chat-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("http://127.0.0.1:3002/");
  await page.screenshot({
    path: "docs/previews/home-desktop.png",
    fullPage: true,
  });
  console.log("Previews saved.");
} finally {
  await browser?.close();
  server.kill();
}

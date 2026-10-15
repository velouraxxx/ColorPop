import { test, expect } from "@playwright/test";
test("create and edit character, chat, save moment and reload", async ({
  page,
}) => {
  await page.goto("/characters/new");
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  await page.getByLabel("Name", { exact: true }).fill("Lucious — test");
  await page
    .getByLabel("Personality", { exact: true })
    .fill("Confident and observant");
  await page
    .getByLabel("First message")
    .fill("The city lights reflect in the windows.");
  await page
    .getByRole("button", { name: "Save Character", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My Characters" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Lucious — test" }),
  ).toBeVisible();
  await page.goto("/chats/new");
  await expect(
    page.getByRole("button", { name: "Lucious — test" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lucious — test" }).click();
  await page.getByLabel("Chat name").fill("Penthouse — test");
  await page.getByRole("button", { name: "Enter the chat" }).click();
  await expect(
    page.getByText("The city lights reflect in the windows.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Your message").fill("I turn toward the window.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.locator(".message.user")).toContainText("I turn toward");
  await page
    .getByRole("button", { name: "Save message", exact: true })
    .last()
    .click();
  await page.reload();
  await expect(page.locator(".message.user")).toContainText("I turn toward");
  await page.goto("/saved");
  await expect(
    page.getByText("I turn toward the window.", { exact: true }),
  ).toBeVisible();
});
for (const width of [375, 390, 430, 1280])
  test(`responsive screens ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/characters/new", "/chats/new", "/settings"]) {
      await page.goto(path);
      await expect(page.getByRole("status")).toContainText(
        "Saved on this device",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  });
test("character details and preferences learned from chat persist", async ({
  page,
}) => {
  await page.goto("/characters/new");
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  const values = {
    Name: "Mara",
    Age: "29",
    Ethnicity: "Mixed heritage",
    Height: "175 cm",
    "Body type": "Athletic",
    "Eye color": "Green",
    "Hair color": "Black",
    "Hair style": "Long locs",
    "Scars, marks": "Scar on left knee",
    Tattoos: "Rose on shoulder",
    Personality: "Warm and witty",
    Spouse: "None",
    "Love interest": "Alex",
    "Current address": "10 Fictional Lane",
    "Current vehicle": "Blue coupe",
  };
  for (const [label, value] of Object.entries(values))
    await page.getByLabel(label, { exact: true }).fill(value);
  await page
    .getByLabel("First message", { exact: true })
    .fill("I love coffee. I hate crowds.");
  await page
    .getByRole("button", { name: "Save Character", exact: true })
    .click();
  await page.goto("/chats/new");
  await page.getByRole("button", { name: "Mara", exact: true }).click();
  await page.getByRole("button", { name: "Enter the chat" }).click();
  await expect(
    page.getByText("I love coffee. I hate crowds.", { exact: true }),
  ).toBeVisible();
  await page.goto("/characters");
  await page.getByRole("link", { name: /Mara/ }).click();
  for (const [label, value] of Object.entries(values))
    await expect(page.getByLabel(label, { exact: true })).toHaveValue(value);
  await expect(page.getByLabel("Likes", { exact: true })).toHaveValue("coffee");
  await expect(page.getByLabel("Dislikes", { exact: true })).toHaveValue(
    "crowds",
  );
  await page.getByLabel("Likes", { exact: true }).fill("Coffee with cream");
  await page
    .getByRole("button", { name: "Save Character", exact: true })
    .click();
  await page.getByRole("link", { name: /Mara/ }).click();
  await page.reload();
  await expect(page.getByLabel("Likes", { exact: true })).toHaveValue(
    "Coffee with cream",
  );
});

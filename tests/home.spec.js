const { test, expect } = require("@playwright/test");

test.describe("Grok Voice homepage", () => {
  test("desktop homepage renders metadata, brand assets, and tabbed voice stack", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Grok Voice/i);
    await expect(page.locator("h1")).toContainText("Grok Voice");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /voice agents, speech-to-text, text-to-speech/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://grokvoice.homes/");

    await expect(page.getByRole("link", { name: "Explore the Voice Stack" })).toBeVisible();
    await expect(page.locator(".trust-strip span")).toHaveCount(4);

    await expect(page.locator('[data-mode-panel="agent"]')).toBeVisible();
    await page.getByRole("tab", { name: "Text to Speech" }).click();
    await expect(page.locator('[data-mode-panel="tts"]')).toBeVisible();
    await expect(page.locator('[data-mode-panel="agent"]')).toBeHidden();

    await page.getByRole("link", { name: "Explore the Voice Stack" }).click();
    await expect(page.locator("#modes")).toBeInViewport();

    const assetsLoaded = await page.evaluate(async () => {
      const logo = document.querySelector(".brand img");
      const imageLoaded = logo instanceof HTMLImageElement && logo.complete && logo.naturalWidth > 0;
      const favicon = await fetch("/assets/brand/favicon.png");
      const social = await fetch("/assets/brand/social-card.png");
      return imageLoaded && favicon.ok && social.ok;
    });

    expect(assetsLoaded).toBe(true);
    await expect(page.locator(".faq-list details")).toHaveCount(4);
  });

  test("mobile layout stays inside the viewport and keeps workflow reachable", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await page.getByRole("link", { name: "Read the FAQ" }).click();
    await expect(page.locator("#faq")).toBeInViewport();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await page.getByRole("link", { name: "Workflow" }).click();
    await expect(page.locator(".step-card")).toHaveCount(4);

    await context.close();
  });

  test("reduced-motion users still get the primary hero content", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce"
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.getByRole("link", { name: "Explore the Voice Stack" })).toBeVisible();
    await expect(page.locator(".wavefield")).toBeVisible();

    await context.close();
  });
});

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { strings } from "../../src/content/strings";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`home page (${colorScheme})`, () => {
    test.use({ colorScheme });

    test("shows the Cairn placeholder", async ({ page }) => {
      await page.goto("/");

      await expect(page).toHaveTitle(strings.app.name);
      await expect(
        page.getByRole("heading", { level: 1, name: strings.home.title }),
      ).toBeVisible();
      await expect(page.getByText(strings.home.lead)).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
    });

    test("has no accessibility violations", async ({ page }) => {
      await page.goto("/");

      const results = await new AxeBuilder({ page })
        .withTags(WCAG_TAGS)
        .analyze();

      expect(results.violations).toEqual([]);
      // axe skips text whose background it cannot work out and lists it as
      // "incomplete"; treat that as a failure so contrast is really checked.
      const unchecked = results.incomplete.filter(
        (item) => item.id === "color-contrast",
      );
      expect(unchecked).toEqual([]);
    });

    test("fits the screen without sideways scrolling", async ({
      page,
    }, testInfo) => {
      await page.goto("/");

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);

      await page.screenshot({
        path: testInfo.outputPath(`home-${colorScheme}.png`),
        fullPage: true,
      });
    });
  });
}

// 320 px wide is what a 1280 px screen shows at 400% zoom (WCAG 1.4.10).
test.describe("home page at 320 px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("still fits without sideways scrolling", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
    await expect(
      page.getByRole("heading", { level: 1, name: strings.home.title }),
    ).toBeVisible();
  });
});

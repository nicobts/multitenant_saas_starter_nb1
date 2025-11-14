import { test, expect } from "@playwright/test";

test("homepage has title and links", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Multitenant SaaS Starter/);

  // Check for sign in link
  const signInLink = page.getByRole("link", { name: /sign in/i });
  await expect(signInLink).toBeVisible();
});

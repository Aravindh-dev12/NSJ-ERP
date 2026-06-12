import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should display and interact with login form", async ({ page }) => {
    await page.goto("/login");

    // Check form elements are visible
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByPlaceholder(/john@example.com/i)).toBeVisible();
    await expect(page.getByPlaceholder(/••••••••/)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should validate form inputs", async ({ page }) => {
    await page.goto("/login");

    // Fill invalid email and password
    const emailInput = page.getByPlaceholder(/john@example.com/i);
    const passwordInput = page.getByPlaceholder(/••••••••/);
    await emailInput.fill("invalid-email");
    await passwordInput.fill("123");

    // Trigger blur events to ensure validation runs
    await emailInput.blur();
    await passwordInput.blur();

    // Optionally, click submit as well
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for validation errors (robust to whitespace/DOM changes)
    await expect(page.getByText(/invalid email address/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByText(/password must be at least 6 characters/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByPlaceholder(/••••••••/);
    const showButton = page.getByLabel(/show password/i);

    // Check initial state
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Toggle to text
    await showButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Now the button label is "Hide password"
    const hideButton = page.getByLabel(/hide password/i);
    await hideButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});

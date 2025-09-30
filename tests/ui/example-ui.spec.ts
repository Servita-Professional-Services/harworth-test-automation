import { test, expect } from '@playwright/test';

test('@ui opens Google homepage', async ({ page }) => {
  const res = await page.goto('https://www.google.com/', { waitUntil: 'domcontentloaded' });
  // Navigation succeeded (2xx/3xx)
  expect(res?.ok()).toBeTruthy();

  // URL contains google.* (also matches consent.google.com)
  await expect(page).toHaveURL(/google\./i);

  // Title either shows Google or the consent screen text
  await expect(page).toHaveTitle(/Google|Before you continue/i);
});

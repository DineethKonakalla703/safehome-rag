import { test, expect } from '@playwright/test';

test.describe('SafeHome-RAG E2E Test Suite', () => {
  test('Login page renders role shortcuts and form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('SafeHome-RAG')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('Main Admin dashboard and AI navigation access', async ({ page }) => {
    await page.goto('/login');
    // Click on Main Admin quick login shortcut
    const adminBtn = page.getByRole('button', { name: /Main Admin/i });
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForURL('**/main-admin/dashboard');
      await expect(page.getByText('Operations command center')).toBeVisible();

      // Check navigation to AI Insights
      await page.goto('/ai-insights');
      await expect(page.getByText('AI Insights')).toBeVisible();

      // Check navigation to Collective Incidents
      await page.goto('/collective-incidents');
      await expect(page.getByText('Collective Incidents')).toBeVisible();

      // Check navigation to Knowledge Support
      await page.goto('/knowledge-support');
      await expect(page.getByText('Knowledge Support')).toBeVisible();
      await expect(page.getByText('Ask the knowledge base')).toBeVisible();

      // Check navigation to Vendor Management
      await page.goto('/vendors');
      await expect(page.getByText('Vendor Management')).toBeVisible();
    }
  });

  test('Resident complaint creation and photo upload UI', async ({ page }) => {
    await page.goto('/login');
    const residentBtn = page.getByRole('button', { name: /Resident/i });
    if (await residentBtn.isVisible()) {
      await residentBtn.click();
      await page.waitForURL('**/resident/dashboard');

      await page.goto('/resident/create-complaint');
      await expect(page.getByText('Create a complaint')).toBeVisible();
      await expect(page.getByText('Text and image safety analysis enabled')).toBeVisible();
      await expect(page.getByPlaceholder('e.g. Water leakage near switchboard')).toBeVisible();
    }
  });

  test('AI Chatbot interface and suggested prompts', async ({ page }) => {
    await page.goto('/login');
    const adminBtn = page.getByRole('button', { name: /Main Admin/i });
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForURL('**/main-admin/dashboard');

      await page.goto('/ai-chatbot');
      await expect(page.getByText('Operations Assistant')).toBeVisible();
      await expect(page.getByPlaceholder(/Ask a question or request an action/i)).toBeVisible();
    }
  });
});

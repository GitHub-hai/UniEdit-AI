import { test, expect } from '@playwright/test';

test.describe('Layout Debug', () => {
  test('check left panel layout', async ({ page }) => {
    // Navigate to the page
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if the edit mode tab exists
    const editTab = page.getByRole('button', { name: /智能编辑/i });
    await expect(editTab).toBeVisible();

    // Check if the edit controls area exists
    const editLabel = page.getByText('编辑指令');
    await expect(editLabel).toBeVisible();

    // Check if the prompt textarea is visible
    const promptTextarea = page.locator('textarea[placeholder*="添加更多的云朵"]');
    await expect(promptTextarea).toBeVisible();

    // Check if the mode controls scroll container exists
    const modeControls = page.locator('.flex-1.min-h-0');
    await expect(modeControls).toBeVisible();

    // Take a screenshot for debugging
    await page.screenshot({ path: 'tests/screenshot-before-upload.png', fullPage: true });

    // Get layout info
    const editLabelBox = await editLabel.boundingBox();
    const modeControlsBox = await modeControls.boundingBox();

    console.log('Edit label position:', editLabelBox);
    console.log('Mode controls position:', modeControlsBox);
  });
});

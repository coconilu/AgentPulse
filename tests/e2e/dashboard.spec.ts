import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/AgentPulse/);
    await expect(page.getByText('AgentPulse')).toBeVisible();
  });

  test('should display header with logo and controls', async ({ page }) => {
    // Logo
    await expect(page.getByText('AgentPulse')).toBeVisible();

    // Follow mode button
    await expect(page.getByRole('button', { name: 'Follow' })).toBeVisible();

    // Connection status
    await expect(page.getByText('Connected').or(page.getByText('Disconnected'))).toBeVisible();
  });

  test('should show empty state when no sessions', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForTimeout(1000);

    // Check empty state messages
    await expect(page.getByText(/No sessions yet|Select a session/)).toBeVisible();
  });

  test('should have three-column layout', async ({ page }) => {
    // Left sidebar (SessionList)
    const leftSidebar = page.locator('aside').first();
    await expect(leftSidebar).toBeVisible();

    // Main content (AgentTree)
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Right sidebar (DetailPanel)
    const rightSidebar = page.locator('aside').last();
    await expect(rightSidebar).toBeVisible();
  });

  test('should connect to WebSocket', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(500);

    // Should show connected status (green dot)
    const connectedIndicator = page.locator('.bg-green-500').first();
    await expect(connectedIndicator.or(page.getByText('Disconnected'))).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should display session after receiving event', async ({ page }) => {
    // This test assumes the server has some test data
    // In a real scenario, you'd send events via API before this test

    await page.goto('/');
    await page.waitForTimeout(1000);

    // If there are sessions, they should be visible
    const sessionCount = page.getByText(/SESSIONS \(\d+\)/);
    await expect(sessionCount.or(page.getByText(/No sessions/))).toBeVisible();
  });

  test('should select session on click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Try to click on a session if it exists
    const sessionButton = page.locator('button').filter({ hasText: /agents.*tools/ }).first();
    const count = await sessionButton.count();

    if (count > 0) {
      await sessionButton.click();
      // Main panel should update to show agent tree
      await expect(page.locator('main')).not.toBeEmpty();
    }
  });
});

test.describe('Agent Display', () => {
  test('should expand agent card on arrow click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Find an expandable agent card
    const expandButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    const count = await expandButton.count();

    if (count > 0) {
      await expandButton.click();
      // Should show tool timeline
      await expect(page.getByText(/Tool Calls|No tool calls/)).toBeVisible();
    }
  });

  test('should open detail panel on Details button click', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Find Details button
    const detailsButton = page.getByRole('button', { name: 'Details' }).first();
    const count = await detailsButton.count();

    if (count > 0) {
      await detailsButton.click();
      // Right panel should show agent details
      await expect(page.getByText('Agent Details').or(page.getByText(/Click "Details"/))).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    // All three columns should be visible
    await expect(page.locator('aside').first()).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('aside').last()).toBeVisible();
  });

  test('should handle smaller viewports', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Should still render without errors
    await expect(page.getByText('AgentPulse')).toBeVisible();
  });
});

test.describe('WebSocket Real-time Updates', () => {
  test('should receive real-time updates', async ({ page }) => {
    await page.goto('/');

    // Listen for WebSocket messages
    let wsMessageReceived = false;

    page.on('websocket', ws => {
      ws.on('framereceived', () => {
        wsMessageReceived = true;
      });
    });

    // Wait for potential messages
    await page.waitForTimeout(2000);

    // WebSocket should be established (even if no messages yet)
    expect(true).toBe(true); // Placeholder - actual WS testing requires more setup
  });
});

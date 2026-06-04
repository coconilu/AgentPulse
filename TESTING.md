# Testing Guide

This document describes the testing strategy and how to run tests for AgentPulse.

## Test Structure

```
agentpulse/
├── packages/
│   ├── shared/
│   │   └── src/
│   │       └── events.test.ts          # Type validation tests
│   ├── server/
│   │   └── src/
│   │       ├── session-manager.test.ts  # Unit tests
│   │       ├── storage.test.ts          # Unit tests
│   │       └── api.test.ts              # Integration tests
│   └── dashboard/
│       └── src/
│           └── components/
│               └── __tests__/
│                   ├── StatusBadge.test.tsx    # Component tests
│                   └── SessionList.test.tsx    # Component tests
├── tests/
│   └── e2e/
│       └── dashboard.spec.ts            # E2E tests (Playwright)
├── playwright.config.ts                 # Playwright configuration
└── vitest.config.ts                     # Vitest configuration (per package)
```

## Test Types

### 1. Unit Tests

**Location**: `packages/*/src/**/*.test.ts`

**Purpose**: Test individual functions, classes, and modules in isolation.

**Coverage**:
- **Shared**: Event type validation
- **Server**: SessionManager logic, EventStorage file operations
- **Dashboard**: React component rendering and behavior

**Run command**:
```bash
# All unit tests
npm run test:unit

# Per package
cd packages/shared && npm run test:unit
cd packages/server && npm run test:unit
cd packages/dashboard && npm run test:unit
```

### 2. Integration Tests

**Location**: `packages/server/src/api.test.ts`

**Purpose**: Test API endpoints and their interaction with the SessionManager.

**Coverage**:
- POST /api/events - Event ingestion
- GET /api/sessions - Session listing
- GET /api/sessions/:id - Single session retrieval
- GET /api/health - Health check

**Run command**:
```bash
cd packages/server && npm run test:integration
```

### 3. Component Tests

**Location**: `packages/dashboard/src/components/__tests__/*.tsx`

**Purpose**: Test React components in isolation using @testing-library/react.

**Coverage**:
- StatusBadge - Status indicator rendering
- SessionList - Session list display and selection

**Run command**:
```bash
cd packages/dashboard && npm run test:unit
```

### 4. E2E Tests

**Location**: `tests/e2e/**/*.spec.ts`

**Purpose**: Test the full application flow from user perspective.

**Coverage**:
- Dashboard loading and layout
- WebSocket connection
- Session display and interaction
- Responsive design

**Run command**:
```bash
# Headless mode
npm run test:e2e

# UI mode (interactive)
npm run test:e2e:ui
```

## Running Tests

### Run All Tests

```bash
npm test
```

This runs all unit, integration, and component tests across all packages.

### Run Tests with Coverage

```bash
npm run test:coverage
```

Generates code coverage reports in:
- `packages/*/coverage/` - Per-package coverage
- HTML reports at `packages/*/coverage/index.html`

### Run Specific Test Suites

```bash
# Only shared package tests
cd packages/shared && npm run test:unit

# Only server unit tests (excludes API tests)
cd packages/server && npm run test:unit

# Only server API integration tests
cd packages/server && npm run test:integration

# Only dashboard component tests
cd packages/dashboard && npm run test:unit
```

### Watch Mode

For development, run tests in watch mode:

```bash
# Shared package
cd packages/shared && npx vitest

# Server package
cd packages/server && npx vitest

# Dashboard package
cd packages/dashboard && npx vitest
```

Vitest will automatically re-run tests when files change.

## Test Dependencies

### Root Level
- `@playwright/test` - E2E testing framework
- `vitest` - Unit/integration test runner (installed per package)

### Per Package

**Shared & Server**:
- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage provider

**Dashboard**:
- `vitest` - Test runner
- `@vitest/coverage-v8` - Coverage provider
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `jsdom` - DOM environment for Node.js

## Writing Tests

### Unit Test Example (Server)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './session-manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  it('should create a new session on first event', () => {
    const event = { /* ... */ };
    const session = manager.processEvent(event);
    expect(session).toBeDefined();
    expect(session?.session_id).toBe('sess-001');
  });
});
```

### Component Test Example (Dashboard)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('should render running status with pulse animation', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });
});
```

### E2E Test Example (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('should load dashboard with correct title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AgentPulse/);
});
```

## Continuous Integration

Tests are designed to run in CI environments. Configure your CI pipeline to:

```yaml
# Example GitHub Actions workflow
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Install Playwright browsers
        run: npx playwright install chromium
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/*/coverage/coverage-final.json
```

## Troubleshooting

### Tests Fail on Windows

Some glob patterns behave differently on Windows. Use Vitest's built-in file discovery instead of shell globs:

```json
{
  "scripts": {
    "test:unit": "vitest run"
  }
}
```

### WebSocket Mock Issues

The dashboard tests mock WebSocket. If you encounter issues, check `packages/dashboard/src/test/setup.ts`.

### Port Conflicts

E2E tests start dev servers on ports 5173 and 7888. Ensure these ports are available or configure different ports in `playwright.config.ts`.

### Slow Tests

If tests are slow:
1. Reduce timeouts in E2E tests
2. Use `--no-coverage` flag for faster unit tests
3. Run only changed tests with Vitest watch mode

## Code Coverage Goals

Target coverage thresholds:
- **Statements**: 80%
- **Branches**: 70%
- **Functions**: 80%
- **Lines**: 80%

Check coverage reports after running:
```bash
npm run test:coverage
```

Reports are generated in `packages/*/coverage/index.html`.

## Best Practices

1. **Name tests descriptively**: Use "should do X when Y" format
2. **Keep tests isolated**: Each test should be independent
3. **Use beforeEach for setup**: Avoid duplicating setup code
4. **Mock external dependencies**: Don't rely on real APIs/files in unit tests
5. **Test edge cases**: Empty states, errors, boundary conditions
6. **Update tests when refactoring**: Keep tests in sync with code changes

---

For more information:
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)

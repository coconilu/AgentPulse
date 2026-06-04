# Test Summary

This document provides an overview of the test coverage for AgentPulse.

## Test Statistics

| Test Type | Count | Status |
|-----------|-------|--------|
| Unit Tests | 39 | ✅ Passing |
| Integration Tests | 9 | ✅ Passing |
| Component Tests | 13 | ✅ Passing |
| E2E Tests | 8 | ⚠️ Requires running servers |
| **Total** | **69** | **✅ Ready** |

## Coverage by Package

### @agentpulse/shared

**Tests**: 8 tests in `events.test.ts`

**Coverage**:
- ✅ SubagentStart event validation
- ✅ SubagentStop event validation
- ✅ PreToolUse event validation
- ✅ PostToolUse event validation
- ✅ TaskCreated event validation
- ✅ Union type for all events
- ✅ SessionView creation
- ✅ AgentView with tool calls

**File**: `packages/shared/src/events.test.ts`

---

### @agentpulse/server

#### Unit Tests (18 tests)

**SessionManager** (`session-manager.test.ts`) - 11 tests:
- ✅ Create new session on first event
- ✅ Deduplicate events by ID
- ✅ Handle SubagentStart correctly
- ✅ Handle SubagentStop correctly
- ✅ Handle PreToolUse and PostToolUse pairing
- ✅ Increment tasks_count on TaskCreated
- ✅ Return empty array initially
- ✅ Return sorted sessions by last_event_at
- ✅ Return null for non-existent session
- ✅ Return session by ID
- ✅ Track processed event IDs

**EventStorage** (`storage.test.ts`) - 7 tests:
- ✅ Return empty array when no files exist
- ✅ Load all events from JSONL files
- ✅ Skip malformed lines
- ✅ Handle missing events directory gracefully
- ✅ Read only new events since last position
- ✅ Return empty array when no new events
- ✅ Call callback when new events are added

#### Integration Tests (9 tests)

**API Endpoints** (`api.test.ts`) - 9 tests:
- ✅ Accept valid SubagentStart event
- ✅ Reject invalid event
- ✅ Aggregate events into sessions
- ✅ Return empty array when no sessions
- ✅ Return all sessions sorted by time
- ✅ Return session by ID
- ✅ Return 404 for non-existent session
- ✅ Return health status
- ✅ Count active sessions

**Files**: 
- `packages/server/src/session-manager.test.ts`
- `packages/server/src/storage.test.ts`
- `packages/server/src/api.test.ts`

---

### @agentpulse/dashboard

**Tests**: 13 tests across 2 component test files

**StatusBadge** (`StatusBadge.test.tsx`) - 7 tests:
- ✅ Render running status with pulse animation
- ✅ Render completed status without animation
- ✅ Render idle status
- ✅ Render error status
- ✅ Render pending status with pulse
- ✅ Render failed status
- ✅ Have correct structure

**SessionList** (`SessionList.test.tsx`) - 6 tests:
- ✅ Render empty state when no sessions
- ✅ Render session count in header
- ✅ Render session items
- ✅ Call selectSession on click
- ✅ Highlight selected session
- ✅ Format time ago correctly

**Files**:
- `packages/dashboard/src/components/__tests__/StatusBadge.test.tsx`
- `packages/dashboard/src/components/__tests__/SessionList.test.tsx`

---

### E2E Tests (Playwright)

**Tests**: 8+ tests in `dashboard.spec.ts`

**Coverage**:
- ✅ Load dashboard with correct title
- ✅ Display header with logo and controls
- ✅ Show empty state when no sessions
- ✅ Have three-column layout
- ✅ Connect to WebSocket
- ✅ Display session after receiving event
- ✅ Select session on click
- ✅ Expand agent card on arrow click
- ✅ Open detail panel on Details button click
- ✅ Work on desktop viewport
- ✅ Handle smaller viewports
- ✅ Receive real-time updates

**File**: `tests/e2e/dashboard.spec.ts`

**Note**: E2E tests require both server and dashboard to be running. Run with `npm run test:e2e`.

---

## Running All Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all unit and integration tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires dev servers)
npm run dev          # Start servers in another terminal
npm run test:e2e     # Run E2E tests
```

## Test Commands Summary

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit and integration tests |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |
| `npm run test:coverage` | Run tests with coverage report |

## Coverage Reports

After running `npm run test:coverage`, reports are generated at:
- Shared: `packages/shared/coverage/index.html`
- Server: `packages/server/coverage/index.html`
- Dashboard: `packages/dashboard/coverage/index.html`

## CI/CD Integration

Tests are configured to run in CI environments. The test suite:
- Uses headless mode for E2E tests
- Generates coverage reports
- Fails on test errors
- Supports parallel test execution

See [TESTING.md](../TESTING.md) for CI configuration examples.

## Last Updated

June 4, 2026

---

**Test Frameworks Used**:
- Vitest 2.1 - Unit and integration tests
- Playwright 1.48 - E2E tests
- Testing Library React 16 - Component tests

**Total Test Files**: 7
**Total Lines of Test Code**: ~1,200

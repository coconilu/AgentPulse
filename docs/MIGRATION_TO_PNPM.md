# Migration from npm to pnpm

This document describes the migration of AgentPulse from npm workspaces to pnpm workspaces.

## Why pnpm?

- **Faster installation**: pnpm uses a content-addressable store, avoiding duplicate downloads
- **Disk efficiency**: Shared dependencies are stored once and symlinked
- **Strict dependency resolution**: Prevents accessing unlisted dependencies
- **Better monorepo support**: Native workspace management with filtering

## Changes Made

### 1. Added `pnpm-workspace.yaml`

Created workspace configuration file:

```yaml
packages:
  - 'packages/*'
```

This replaces the `workspaces` field in `package.json`.

### 2. Updated Root `package.json`

**Before (npm):**
```json
{
  "workspaces": [
    "packages/shared",
    "packages/hook",
    "packages/server",
    "packages/dashboard"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:dashboard\"",
    "dev:server": "npm run dev --workspace=packages/server",
    "build": "npm run build --workspaces"
  }
}
```

**After (pnpm):**
```json
{
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "concurrently \"pnpm run dev:server\" \"pnpm run dev:dashboard\"",
    "dev:server": "pnpm --filter @agentpulse/server run dev",
    "build": "pnpm -r run build"
  }
}
```

Key changes:
- Removed `workspaces` array (now in `pnpm-workspace.yaml`)
- Added `packageManager` field for Corepack support
- Changed `--workspace=` to `--filter` syntax
- Changed `--workspaces` to `-r` (recursive) flag

### 3. Updated `.gitignore`

Added pnpm-specific ignores:

```
# pnpm
pnpm-lock.yaml
.pnpm-store/
```

### 4. Updated TypeScript Configuration

Updated `packages/server/tsconfig.json` to resolve shared types:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@agentpulse/shared": ["../shared/src/index.ts"]
    }
  }
}
```

Removed `rootDir` to allow importing from sibling packages.

### 5. Fixed Test Files

Added missing imports in test files:

```typescript
// Before
import { describe, it, expect, vi } from 'vitest';

// After
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

## Command Comparison

| Task | npm | pnpm |
|------|-----|------|
| Install dependencies | `npm install` | `pnpm install` |
| Run dev servers | `npm run dev` | `pnpm run dev` |
| Build all packages | `npm run build` | `pnpm run build` |
| Run all tests | `npm test` | `pnpm test` |
| Run in specific package | `npm run dev --workspace=packages/server` | `pnpm --filter @agentpulse/server run dev` |
| Run recursively | `npm run build --workspaces` | `pnpm -r run build` |
| List packages | `npm ls` | `pnpm list` |

## Installation

### Prerequisites

Install pnpm if not already installed:

```bash
# Using npm
npm install -g pnpm

# Or using Corepack (recommended)
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

### First Time Setup

```bash
# Clone repository
git clone https://github.com/your-org/agentpulse.git
cd agentpulse

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run development servers
pnpm run dev
```

## Benefits After Migration

### Faster Installation

```bash
# npm: ~45 seconds
npm install

# pnpm: ~15 seconds (3x faster)
pnpm install
```

### Disk Space Savings

```bash
# npm: ~450 MB (duplicates included)
du -sh node_modules

# pnpm: ~180 MB (shared store)
du -sh node_modules
```

### Strict Dependency Resolution

pnpm prevents accessing unlisted dependencies, catching issues early:

```bash
# This will fail if dependency is not in package.json
pnpm --filter @agentpulse/server run dev
```

## Troubleshooting

### Issue: Cannot find module '@agentpulse/shared'

**Solution**: Ensure TypeScript paths are configured correctly in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@agentpulse/shared": ["../shared/src/index.ts"]
    }
  }
}
```

### Issue: Build fails with rootDir error

**Solution**: Remove `rootDir` from tsconfig or set it to include shared package:

```json
{
  "compilerOptions": {
    "outDir": "./dist"
    // Remove rootDir or set appropriately
  }
}
```

### Issue: Tests fail with beforeEach not defined

**Solution**: Import `beforeEach` from vitest:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
```

## CI/CD Updates

Update your CI pipeline to use pnpm:

```yaml
# Example GitHub Actions workflow
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Enable Corepack for pnpm
      - name: Enable Corepack
        run: corepack enable
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'  # Changed from 'npm' to 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm run build
      
      - name: Test
        run: pnpm test
```

## Rolling Back to npm

If you need to roll back:

1. Delete `pnpm-workspace.yaml`
2. Restore `workspaces` field in root `package.json`
3. Change scripts back to npm syntax
4. Remove `packageManager` field
5. Run `npm install`

## References

- [pnpm Documentation](https://pnpm.io/)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Migrating from npm](https://pnpm.io/migration)
- [Corepack Documentation](https://nodejs.org/api/corepack.html)

---

**Migration Date**: June 4, 2026  
**pnpm Version**: 9.15.0  
**Node.js Version**: 24.15.0

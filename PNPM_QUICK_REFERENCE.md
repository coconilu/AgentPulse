# pnpm Quick Reference for AgentPulse

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start development servers (backend + frontend)
pnpm run dev

# Start only backend
pnpm run dev:server

# Start only frontend
pnpm run dev:dashboard
```

### Building

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm --filter @agentpulse/hook run build

# Build hook script
pnpm run build:hook
```

### Testing

```bash
# Run all unit tests
pnpm test

# Run integration tests
pnpm run test:integration

# Run E2E tests
pnpm run test:e2e

# Run with coverage
pnpm run test:coverage
```

### Package Management

```bash
# Add dependency to root
pnpm add -D <package>

# Add dependency to specific package
pnpm --filter @agentpulse/server add fastify

# Remove dependency
pnpm --filter @agentpulse/dashboard remove lodash

# Update dependencies
pnpm update
```

### Workspace Operations

```bash
# List all packages
pnpm list -r --depth 0

# Run command in all packages
pnpm -r run build

# Run command in specific package
pnpm --filter @agentpulse/server run dev

# Filter by pattern
pnpm --filter "@agentpulse/*" run build
```

## Key Differences from npm

| Feature | npm | pnpm |
|---------|-----|------|
| Install | `npm install` | `pnpm install` |
| Workspace flag | `--workspace=` | `--filter` |
| All workspaces | `--workspaces` | `-r` (recursive) |
| Lock file | `package-lock.json` | `pnpm-lock.yaml` |
| Store location | Per-project | Global (~/.pnpm-store) |

## Troubleshooting

### Clean Install

```bash
# Remove all node_modules
rm -rf node_modules packages/*/node_modules

# Remove lock file
rm pnpm-lock.yaml

# Reinstall
pnpm install
```

### Clear Cache

```bash
pnpm store prune
```

### Check Disk Usage

```bash
# Show store size
du -sh ~/.pnpm-store

# List store contents
ls -la ~/.pnpm-store
```

## Useful Flags

- `-r, --recursive`: Run in all workspace packages
- `--filter <pattern>`: Filter packages by name/pattern
- `--prod`: Production dependencies only
- `--dev`: Dev dependencies only
- `--no-frozen-lockfile`: Allow lockfile updates

## Examples

```bash
# Build only changed packages
pnpm -r --filter "..." run build

# Test server package with watch mode
pnpm --filter @agentpulse/server exec vitest

# Add same dependency to all packages
pnpm -r add typescript

# Run lint in dashboard only
pnpm --filter dashboard run lint
```

## Resources

- [pnpm CLI Docs](https://pnpm.io/cli/install)
- [Workspace Docs](https://pnpm.io/workspaces)
- [Filtering Docs](https://pnpm.io/filtering)

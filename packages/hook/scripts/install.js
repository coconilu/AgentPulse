#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageDir = dirname(__dirname);
const repoRoot = join(packageDir, '..', '..');

const dryRun = process.argv.includes('--dry-run');
const hookEvents = [
  'SubagentStart',
  'SubagentStop',
  'PreToolUse',
  'PostToolUse',
  'TaskCreated',
  'TaskCompleted',
];

const sourceHookPath = join(packageDir, 'dist', 'agentpulse-hook.js');
const installDir = join(homedir(), '.agentpulse', 'hook');
const installedHookPath = join(installDir, 'agentpulse-hook.js');
const claudeSettingsPath = join(homedir(), '.claude', 'settings.json');

function log(message) {
  console.log(`[AgentPulse] ${message}`);
}

function readJson(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Unable to parse ${filePath}: ${error.message}`);
  }
}

function writeJson(filePath, value) {
  const content = `${JSON.stringify(value, null, 2)}\n`;
  if (dryRun) {
    log(`Would write ${filePath}`);
    return;
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
}

function backupFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${filePath}.agentpulse-backup-${timestamp}`;
  if (dryRun) {
    log(`Would back up ${filePath} to ${backupPath}`);
    return;
  }

  copyFileSync(filePath, backupPath);
  log(`Backed up ${filePath} to ${backupPath}`);
}

function commandForHook(hookPath) {
  const escapedPath = hookPath.replace(/"/g, '\\"');
  return `node "${escapedPath}"`;
}

function createHookEntry(hookPath) {
  return {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: commandForHook(hookPath),
      },
    ],
  };
}

function isAgentPulseHookEntry(entry) {
  if (!entry || !Array.isArray(entry.hooks)) {
    return false;
  }

  return entry.hooks.some((hook) => {
    const command = typeof hook?.command === 'string' ? hook.command : '';
    const args = Array.isArray(hook?.args) ? hook.args.join(' ') : '';
    return `${command} ${args}`.includes('agentpulse-hook.js');
  });
}

function mergeHooks(settings) {
  const next = { ...settings, hooks: { ...(settings.hooks || {}) } };

  for (const eventName of hookEvents) {
    const existingEntries = Array.isArray(next.hooks[eventName]) ? next.hooks[eventName] : [];
    const withoutOldAgentPulseEntries = existingEntries.filter((entry) => !isAgentPulseHookEntry(entry));
    const nextEntries = [...withoutOldAgentPulseEntries, createHookEntry(installedHookPath)];

    next.hooks[eventName] = nextEntries;
  }

  return next;
}

function buildHook() {
  log('Building hook bundle...');
  if (dryRun) {
    log('Would run: pnpm --filter @agentpulse/hook run build');
    return;
  }

  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  execFileSync(pnpmCommand, ['--filter', '@agentpulse/hook', 'run', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
}

function installHookBundle() {
  if (!existsSync(sourceHookPath)) {
    if (dryRun) {
      log(`Would copy ${sourceHookPath} to ${installedHookPath}`);
      return;
    }

    throw new Error(`Hook bundle not found at ${sourceHookPath}. Run "pnpm run build:hook" first.`);
  }

  if (dryRun) {
    log(`Would copy ${sourceHookPath} to ${installedHookPath}`);
    return;
  }

  mkdirSync(installDir, { recursive: true });
  copyFileSync(sourceHookPath, installedHookPath);
  log(`Installed hook bundle to ${installedHookPath}`);
}

function installClaudeHooks() {
  const settings = readJson(claudeSettingsPath);
  const nextSettings = mergeHooks(settings);

  backupFile(claudeSettingsPath);
  writeJson(claudeSettingsPath, nextSettings);
  log(`Configured Claude hooks in ${claudeSettingsPath}`);
}

try {
  buildHook();
  installHookBundle();
  installClaudeHooks();
  log(dryRun ? 'Dry run complete.' : 'Install complete.');
} catch (error) {
  console.error(`[AgentPulse] ${error.message}`);
  process.exit(1);
}

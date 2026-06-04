import { readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import http from 'http';

const PORT = 7888;
const EVENTS_DIR = join(homedir(), '.agentpulse', 'events');

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function main() {
  // 1. Read stdin (Claude Code passes JSON)
  let rawInput: string;
  try {
    rawInput = readFileSync(0, 'utf-8');
  } catch {
    process.exit(0);
  }

  if (!rawInput || !rawInput.trim()) {
    process.exit(0);
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawInput);
  } catch {
    process.exit(0);
  }

  // 2. Normalize event
  const normalizedEvent = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    hook_event_name: event.hook_event_name as string,
    session_id: (event.session_id as string) || 'unknown',
    cwd: (event.cwd as string) || '',
    agent_id: (event.agent_id as string) || null,
    agent_type: (event.agent_type as string) || null,
    tool_name: (event.tool_name as string) || null,
    tool_input: event.tool_input || null,
    tool_response: event.tool_response || null,
    last_assistant_message: (event.last_assistant_message as string) || null,
    agent_transcript_path: (event.agent_transcript_path as string) || null,
    task_id: (event.task_id as string) || null,
    task_subject: (event.task_subject as string) || null,
    task_description: (event.task_description as string) || null,
  };

  // 3. ALWAYS persist to JSONL file
  mkdirSync(EVENTS_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const filePath = join(EVENTS_DIR, `${dateStr}.jsonl`);
  appendFileSync(filePath, JSON.stringify(normalizedEvent) + '\n');

  // 4. TRY to POST to server (fire-and-forget)
  const postData = JSON.stringify(normalizedEvent);
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 2000,
    },
    () => {
      // ignore response
    }
  );

  req.on('error', () => {
    // silent failure - data is already persisted to disk
  });

  req.on('timeout', () => {
    req.destroy();
  });

  req.write(postData);
  req.end();

  // Give the HTTP request a moment to complete
  setTimeout(() => process.exit(0), 100);
}

main();

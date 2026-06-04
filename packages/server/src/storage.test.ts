import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import type { AgentPulseEvent } from '@agentpulse/shared';
import { EventStorage } from './storage';

describe('EventStorage', () => {
  let storage: EventStorage;
  let testDir: string;

  beforeEach(() => {
    // Create temporary directory for tests
    testDir = join(tmpdir(), `agentpulse-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    storage = new EventStorage(testDir);
  });

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadAll', () => {
    it('should return empty array when no files exist', () => {
      const events = storage.loadAll();
      expect(events).toEqual([]);
    });

    it('should load all events from JSONL files', () => {
      // Create test file
      const filePath = join(testDir, '2026-06-04.jsonl');
      const events: AgentPulseEvent[] = [
        {
          id: 'e1',
          timestamp: '2026-06-04T09:00:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 's1',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
        },
        {
          id: 'e2',
          timestamp: '2026-06-04T09:01:00.000Z',
          hook_event_name: 'PreToolUse',
          session_id: 's1',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
          tool_name: 'Read',
          tool_input: {},
        },
      ];

      writeFileSync(filePath, events.map((e) => JSON.stringify(e)).join('\n') + '\n');

      const loaded = storage.loadAll();

      expect(loaded).toHaveLength(2);
      expect(loaded[0].id).toBe('e1');
      expect(loaded[1].id).toBe('e2');
    });

    it('should skip malformed lines', () => {
      const filePath = join(testDir, '2026-06-04.jsonl');
      const content = `{"id":"e1","timestamp":"2026-06-04T09:00:00.000Z","hook_event_name":"SubagentStart","session_id":"s1","cwd":"/test","agent_id":"a1","agent_type":"explorer"}
invalid json line
{"id":"e2","timestamp":"2026-06-04T09:01:00.000Z","hook_event_name":"PreToolUse","session_id":"s1","cwd":"/test","agent_id":"a1","agent_type":"explorer","tool_name":"Read","tool_input":{}}
`;

      writeFileSync(filePath, content);

      const loaded = storage.loadAll();

      expect(loaded).toHaveLength(2); // Should skip the invalid line
    });

    it('should handle missing events directory gracefully', () => {
      rmSync(testDir, { recursive: true, force: true });
      storage = new EventStorage(testDir);

      const events = storage.loadAll();
      expect(events).toEqual([]);
    });
  });

  describe('readNewFromFile', () => {
    it('should read only new events since last position', () => {
      const filePath = join(testDir, '2026-06-04.jsonl');

      // Write initial events
      const event1: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 's1',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };
      writeFileSync(filePath, JSON.stringify(event1) + '\n');

      // Load to set initial position
      storage.loadAll();

      // Append new event using appendFileSync
      const event2: AgentPulseEvent = {
        id: 'e2',
        timestamp: '2026-06-04T09:01:00.000Z',
        hook_event_name: 'PreToolUse',
        session_id: 's1',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
        tool_name: 'Read',
        tool_input: {},
      };
      const fs = require('fs');
      fs.appendFileSync(filePath, JSON.stringify(event2) + '\n');

      const newEvents = storage.readNewFromFile(filePath);

      expect(newEvents).toHaveLength(1);
      expect(newEvents[0].id).toBe('e2');
    });

    it('should return empty array when no new events', () => {
      const filePath = join(testDir, '2026-06-04.jsonl');
      const event1: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 's1',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };
      writeFileSync(filePath, JSON.stringify(event1) + '\n');

      // Read all
      storage.loadAll();

      // Try to read again - should be empty
      const newEvents = storage.readNewFromFile(filePath);
      expect(newEvents).toEqual([]);
    });
  });

  describe('watchForChanges', () => {
    it('should call callback when new events are added', async () => {
      const newEvents: AgentPulseEvent[][] = [];
      const callback = (events: AgentPulseEvent[]) => {
        newEvents.push(events);
      };

      storage.watchForChanges(callback);

      // Wait a bit for watcher to initialize
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create a new file
      const filePath = join(testDir, '2026-06-04.jsonl');
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 's1',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };
      writeFileSync(filePath, JSON.stringify(event) + '\n');

      // Wait for file watcher to detect change
      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(newEvents.length).toBeGreaterThan(0);
      expect(newEvents[0]).toHaveLength(1);
      expect(newEvents[0][0].id).toBe('e1');
    });
  });
});

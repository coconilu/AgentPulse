import { describe, it, expect, beforeEach } from 'vitest';
import type { AgentPulseEvent } from '@agentpulse/shared';
import { SessionManager } from './session-manager';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
  });

  describe('processEvent', () => {
    it('should create a new session on first event', () => {
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };

      const session = manager.processEvent(event);

      expect(session).toBeDefined();
      expect(session?.session_id).toBe('sess-001');
      expect(session?.status).toBe('running');
    });

    it('should deduplicate events by ID', () => {
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };

      const result1 = manager.processEvent(event);
      const result2 = manager.processEvent(event);

      expect(result1).toBeDefined();
      expect(result2).toBeNull(); // Duplicate should return null
    });

    it('should handle SubagentStart correctly', () => {
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };

      const session = manager.processEvent(event);

      expect(session?.agents).toHaveLength(1);
      expect(session?.agents[0].agent_id).toBe('a1');
      expect(session?.agents[0].status).toBe('running');
    });

    it('should handle SubagentStop correctly', () => {
      // Start agent
      manager.processEvent({
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      } as AgentPulseEvent);

      // Stop agent
      const stopEvent: AgentPulseEvent = {
        id: 'e2',
        timestamp: '2026-06-04T09:05:00.000Z',
        hook_event_name: 'SubagentStop',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
        last_assistant_message: 'Done',
      };

      const session = manager.processEvent(stopEvent);

      expect(session?.agents[0].status).toBe('completed');
      expect(session?.agents[0].last_assistant_message).toBe('Done');
      expect(session?.agents[0].duration_ms).toBe(300000); // 5 minutes
    });

    it('should handle PreToolUse and PostToolUse pairing', () => {
      // Start agent
      manager.processEvent({
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      } as AgentPulseEvent);

      // PreToolUse
      manager.processEvent({
        id: 'e2',
        timestamp: '2026-06-04T09:01:00.000Z',
        hook_event_name: 'PreToolUse',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
        tool_name: 'Read',
        tool_input: { file_path: '/src/index.ts' },
      } as AgentPulseEvent);

      // PostToolUse
      const postEvent: AgentPulseEvent = {
        id: 'e3',
        timestamp: '2026-06-04T09:01:05.000Z',
        hook_event_name: 'PostToolUse',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
        tool_name: 'Read',
        tool_input: { file_path: '/src/index.ts' },
        tool_response: 'File content',
      };

      const session = manager.processEvent(postEvent);

      expect(session?.tool_calls_count).toBe(1);
      expect(session?.agents[0].tool_calls).toHaveLength(1);
      expect(session?.agents[0].tool_calls[0].status).toBe('completed');
      expect(session?.agents[0].tool_calls[0].tool_response).toBe('File content');
    });

    it('should increment tasks_count on TaskCreated', () => {
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'TaskCreated',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: null,
        agent_type: null,
        task_id: 't1',
        task_subject: 'Test task',
      };

      const session = manager.processEvent(event);

      expect(session?.tasks_count).toBe(1);
    });
  });

  describe('getAllSessions', () => {
    it('should return empty array initially', () => {
      const sessions = manager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it('should return sorted sessions by last_event_at', () => {
      // Create session 1
      manager.processEvent({
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test1',
        agent_id: 'a1',
        agent_type: 'explorer',
      } as AgentPulseEvent);

      // Create session 2 (later)
      manager.processEvent({
        id: 'e2',
        timestamp: '2026-06-04T09:05:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-002',
        cwd: '/test2',
        agent_id: 'a2',
        agent_type: 'reviewer',
      } as AgentPulseEvent);

      const sessions = manager.getAllSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions[0].session_id).toBe('sess-002'); // Most recent first
      expect(sessions[1].session_id).toBe('sess-001');
    });
  });

  describe('getSession', () => {
    it('should return null for non-existent session', () => {
      const session = manager.getSession('non-existent');
      expect(session).toBeNull();
    });

    it('should return session by ID', () => {
      manager.processEvent({
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      } as AgentPulseEvent);

      const session = manager.getSession('sess-001');

      expect(session).not.toBeNull();
      expect(session?.session_id).toBe('sess-001');
    });
  });

  describe('isProcessed', () => {
    it('should track processed event IDs', () => {
      expect(manager.isProcessed('e1')).toBe(false);

      manager.processEvent({
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      } as AgentPulseEvent);

      expect(manager.isProcessed('e1')).toBe(true);
      expect(manager.isProcessed('e2')).toBe(false);
    });
  });
});

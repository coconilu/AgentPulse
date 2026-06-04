import { describe, it, expect } from 'vitest';
import type {
  AgentPulseEvent,
  SubagentStartEvent,
  SubagentStopEvent,
  PreToolUseEvent,
  PostToolUseEvent,
  TaskCreatedEvent,
  SessionView,
  AgentView,
} from './events';

describe('Event Types', () => {
  it('should validate SubagentStart event structure', () => {
    const event: SubagentStartEvent = {
      id: 'test-001',
      timestamp: '2026-06-04T09:00:00.000Z',
      hook_event_name: 'SubagentStart',
      session_id: 'sess-abc123',
      cwd: '/test/path',
      agent_id: 'agent-001',
      agent_type: 'explore-agent',
    };

    expect(event.id).toBe('test-001');
    expect(event.hook_event_name).toBe('SubagentStart');
    expect(event.agent_id).toBe('agent-001');
  });

  it('should validate SubagentStop event structure', () => {
    const event: SubagentStopEvent = {
      id: 'test-002',
      timestamp: '2026-06-04T09:05:00.000Z',
      hook_event_name: 'SubagentStop',
      session_id: 'sess-abc123',
      cwd: '/test/path',
      agent_id: 'agent-001',
      agent_type: 'explore-agent',
      last_assistant_message: 'Task completed successfully',
      agent_transcript_path: '/path/to/transcript.json',
    };

    expect(event.hook_event_name).toBe('SubagentStop');
    expect(event.last_assistant_message).toContain('completed');
  });

  it('should validate PreToolUse event structure', () => {
    const event: PreToolUseEvent = {
      id: 'test-003',
      timestamp: '2026-06-04T09:01:00.000Z',
      hook_event_name: 'PreToolUse',
      session_id: 'sess-abc123',
      cwd: '/test/path',
      agent_id: 'agent-001',
      agent_type: 'explore-agent',
      tool_name: 'Read',
      tool_input: { file_path: '/src/index.ts' },
    };

    expect(event.tool_name).toBe('Read');
    expect(event.tool_input.file_path).toBe('/src/index.ts');
  });

  it('should validate PostToolUse event structure', () => {
    const event: PostToolUseEvent = {
      id: 'test-004',
      timestamp: '2026-06-04T09:01:05.000Z',
      hook_event_name: 'PostToolUse',
      session_id: 'sess-abc123',
      cwd: '/test/path',
      agent_id: 'agent-001',
      agent_type: 'explore-agent',
      tool_name: 'Read',
      tool_input: { file_path: '/src/index.ts' },
      tool_response: { content: 'file content here', lines: 105 },
    };

    expect(event.tool_name).toBe('Read');
    expect(event.tool_response).toBeDefined();
  });

  it('should validate TaskCreated event structure', () => {
    const event: TaskCreatedEvent = {
      id: 'test-005',
      timestamp: '2026-06-04T09:02:00.000Z',
      hook_event_name: 'TaskCreated',
      session_id: 'sess-abc123',
      cwd: '/test/path',
      agent_id: null,
      agent_type: null,
      task_id: 'task-001',
      task_subject: 'Fix bug in authentication',
      task_description: 'User reported login issue',
    };

    expect(event.task_id).toBe('task-001');
    expect(event.task_subject).toContain('bug');
  });

  it('should allow union type for all events', () => {
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
        tool_name: 'Glob',
        tool_input: { pattern: '*.ts' },
      },
    ];

    expect(events).toHaveLength(2);
    expect(events[0].hook_event_name).toBe('SubagentStart');
    expect(events[1].hook_event_name).toBe('PreToolUse');
  });
});

describe('Session and Agent Views', () => {
  it('should create valid SessionView', () => {
    const session: SessionView = {
      session_id: 'sess-001',
      cwd: '/project/root',
      started_at: '2026-06-04T09:00:00.000Z',
      last_event_at: '2026-06-04T09:10:00.000Z',
      status: 'running',
      agents: [],
      tool_calls_count: 0,
      tasks_count: 0,
    };

    expect(session.session_id).toBe('sess-001');
    expect(session.status).toBe('running');
  });

  it('should create valid AgentView with tool calls', () => {
    const agent: AgentView = {
      agent_id: 'agent-001',
      agent_type: 'code-reviewer',
      session_id: 'sess-001',
      status: 'completed',
      started_at: '2026-06-04T09:00:00.000Z',
      completed_at: '2026-06-04T09:05:00.000Z',
      duration_ms: 300000,
      tool_calls: [
        {
          id: 'tc-001',
          tool_name: 'Grep',
          tool_input: { pattern: 'TODO' },
          tool_response: 'Found 5 matches',
          timestamp: '2026-06-04T09:02:00.000Z',
          status: 'completed',
        },
      ],
      last_assistant_message: 'Review complete',
    };

    expect(agent.status).toBe('completed');
    expect(agent.duration_ms).toBe(300000);
    expect(agent.tool_calls).toHaveLength(1);
    expect(agent.tool_calls[0].status).toBe('completed');
  });
});

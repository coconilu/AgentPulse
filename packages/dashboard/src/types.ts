export type HookEventName =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'TaskCreated'
  | 'TaskCompleted';

export interface AgentPulseEvent {
  id: string;
  timestamp: string;
  hook_event_name: HookEventName;
  session_id: string;
  cwd: string;
  agent_id: string | null;
  agent_type: string | null;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_response?: unknown;
  last_assistant_message?: string | null;
  task_id?: string;
  task_subject?: string;
}

export interface SessionView {
  session_id: string;
  cwd: string;
  started_at: string;
  last_event_at: string;
  status: 'running' | 'idle' | 'completed';
  agents: AgentView[];
  tool_calls_count: number;
  tasks_count: number;
}

export interface AgentView {
  agent_id: string;
  agent_type: string;
  session_id: string;
  status: 'running' | 'completed' | 'error';
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  tool_calls: ToolCallView[];
  last_assistant_message: string | null;
}

export interface ToolCallView {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: unknown;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export type WSMessage =
  | { type: 'event'; payload: AgentPulseEvent }
  | { type: 'session_update'; payload: SessionView }
  | { type: 'initial_state'; payload: SessionView[] }
  | { type: 'ping' }
  | { type: 'pong' };

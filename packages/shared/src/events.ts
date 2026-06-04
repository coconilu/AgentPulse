/** All AgentPulse hook event names */
export type HookEventName =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SubagentStart'
  | 'SubagentStop'
  | 'TaskCreated'
  | 'TaskCompleted';

/** Base fields present in every AgentPulse event */
export interface BaseEvent {
  id: string;
  timestamp: string;
  hook_event_name: HookEventName;
  session_id: string;
  cwd: string;
  agent_id: string | null;
  agent_type: string | null;
}

export interface PreToolUseEvent extends BaseEvent {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface PostToolUseEvent extends BaseEvent {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: unknown;
}

export interface SubagentStartEvent extends BaseEvent {
  hook_event_name: 'SubagentStart';
  agent_id: string;
  agent_type: string;
}

export interface SubagentStopEvent extends BaseEvent {
  hook_event_name: 'SubagentStop';
  agent_id: string;
  agent_type: string;
  last_assistant_message: string | null;
  agent_transcript_path: string | null;
}

export interface TaskCreatedEvent extends BaseEvent {
  hook_event_name: 'TaskCreated';
  task_id: string;
  task_subject: string;
  task_description: string | null;
}

export interface TaskCompletedEvent extends BaseEvent {
  hook_event_name: 'TaskCompleted';
  task_id: string;
  task_subject: string | null;
}

export type AgentPulseEvent =
  | PreToolUseEvent
  | PostToolUseEvent
  | SubagentStartEvent
  | SubagentStopEvent
  | TaskCreatedEvent
  | TaskCompletedEvent;

/** Aggregated session view */
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

/** Aggregated agent view */
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

/** Single tool call */
export interface ToolCallView {
  id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_response: unknown;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

/** WebSocket message protocol */
export type WSMessage =
  | { type: 'event'; payload: AgentPulseEvent }
  | { type: 'session_update'; payload: SessionView }
  | { type: 'initial_state'; payload: SessionView[] }
  | { type: 'ping' }
  | { type: 'pong' };

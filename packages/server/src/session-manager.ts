import type {
  AgentPulseEvent,
  SessionView,
  AgentView,
  ToolCallView,
} from '@agentpulse/shared';

const SESSION_IDLE_TIMEOUT = 300000; // 5 min
const SESSION_RUNNING_THRESHOLD = 30000; // 30s

export class SessionManager {
  private sessions: Map<string, SessionView> = new Map();
  private processedIds: Set<string> = new Set();

  /** Process a single event and return updated session */
  processEvent(event: AgentPulseEvent): SessionView | null {
    // Dedup
    if (this.processedIds.has(event.id)) {
      return null;
    }
    this.processedIds.add(event.id);

    const sessionId = event.session_id;
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        session_id: sessionId,
        cwd: event.cwd,
        started_at: event.timestamp,
        last_event_at: event.timestamp,
        status: 'running',
        agents: [],
        tool_calls_count: 0,
        tasks_count: 0,
      };
      this.sessions.set(sessionId, session);
    }

    session.last_event_at = event.timestamp;
    session.status = 'running';

    switch (event.hook_event_name) {
      case 'SubagentStart':
        this.handleSubagentStart(session, event);
        break;
      case 'SubagentStop':
        this.handleSubagentStop(session, event);
        break;
      case 'PreToolUse':
        this.handlePreToolUse(session, event);
        break;
      case 'PostToolUse':
        this.handlePostToolUse(session, event);
        break;
      case 'TaskCreated':
        session.tasks_count++;
        break;
      case 'TaskCompleted':
        break;
    }

    return session;
  }

  /** Process multiple events (e.g., on startup) */
  processEvents(events: AgentPulseEvent[]): void {
    for (const event of events) {
      this.processEvent(event);
    }
    // After loading history, update statuses
    this.refreshStatuses();
  }

  private handleSubagentStart(session: SessionView, event: AgentPulseEvent): void {
    if (event.hook_event_name !== 'SubagentStart') return;
    const agent: AgentView = {
      agent_id: event.agent_id,
      agent_type: event.agent_type,
      session_id: session.session_id,
      status: 'running',
      started_at: event.timestamp,
      completed_at: null,
      duration_ms: null,
      tool_calls: [],
      last_assistant_message: null,
    };
    session.agents.push(agent);
  }

  private handleSubagentStop(session: SessionView, event: AgentPulseEvent): void {
    if (event.hook_event_name !== 'SubagentStop') return;
    const agent = session.agents.find((a) => a.agent_id === event.agent_id);
    if (agent) {
      agent.status = 'completed';
      agent.completed_at = event.timestamp;
      agent.duration_ms =
        new Date(event.timestamp).getTime() - new Date(agent.started_at).getTime();
      agent.last_assistant_message = event.last_assistant_message;
    }
  }

  private handlePreToolUse(session: SessionView, event: AgentPulseEvent): void {
    if (event.hook_event_name !== 'PreToolUse') return;
    session.tool_calls_count++;

    const toolCall: ToolCallView = {
      id: event.id,
      tool_name: event.tool_name,
      tool_input: event.tool_input,
      tool_response: null,
      timestamp: event.timestamp,
      status: 'pending',
    };

    // Assign to agent if agent_id present
    if (event.agent_id) {
      const agent = session.agents.find((a) => a.agent_id === event.agent_id);
      if (agent) {
        agent.tool_calls.push(toolCall);
      }
    }
  }

  private handlePostToolUse(session: SessionView, event: AgentPulseEvent): void {
    if (event.hook_event_name !== 'PostToolUse') return;

    // Find matching PreToolUse by tool_name in the agent
    if (event.agent_id) {
      const agent = session.agents.find((a) => a.agent_id === event.agent_id);
      if (agent) {
        // Find the last pending tool call with same name
        const tc = [...agent.tool_calls]
          .reverse()
          .find((t) => t.tool_name === event.tool_name && t.status === 'pending');
        if (tc) {
          tc.status = 'completed';
          tc.tool_response = event.tool_response;
        }
      }
    }
  }

  /** Refresh session/agent statuses based on time */
  refreshStatuses(): void {
    const now = Date.now();
    for (const session of this.sessions.values()) {
      const lastEvent = new Date(session.last_event_at).getTime();
      const elapsed = now - lastEvent;

      if (elapsed > SESSION_IDLE_TIMEOUT) {
        session.status = 'completed';
      } else if (elapsed > SESSION_RUNNING_THRESHOLD) {
        session.status = 'idle';
      } else {
        session.status = 'running';
      }
    }
  }

  getAllSessions(): SessionView[] {
    this.refreshStatuses();
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime()
    );
  }

  getSession(sessionId: string): SessionView | null {
    return this.sessions.get(sessionId) || null;
  }

  /** Check if event was already processed */
  isProcessed(eventId: string): boolean {
    return this.processedIds.has(eventId);
  }
}

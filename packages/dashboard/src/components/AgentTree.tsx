import { useStore } from '../store';
import { AgentCard } from './AgentCard';
import type { SessionView } from '../types';

interface AgentTreeProps {
  sessionId: string;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '--';
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${minutes}m ${remainingSecs}s`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function AgentTree({ sessionId }: AgentTreeProps) {
  const sessions = useStore((s) => s.sessions);
  const session = sessions.find((s) => s.session_id === sessionId);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600">
        Session not found
      </div>
    );
  }

  const sessionSummary = getSessionSummary(session);

  return (
    <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
      {/* Session header */}
      <div className="mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-200 truncate">
            {session.cwd}
          </h2>
          <span className={`text-xs px-2 py-0.5 rounded ${statusColor(session.status)}`}>
            {session.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>ID: {session.session_id.slice(0, 16)}...</span>
          <span>{session.agents.length} agents</span>
          <span>{session.tool_calls_count} tool calls</span>
          <span>{session.tasks_count} tasks</span>
          <span>Last: {formatTime(session.last_event_at)}</span>
        </div>
        {/* Stats bar */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          <StatCard label="Running" value={sessionSummary.running} color="text-green-400" />
          <StatCard label="Completed" value={sessionSummary.completed} color="text-gray-400" />
          <StatCard label="Errors" value={sessionSummary.errors} color="text-red-400" />
          <StatCard label="Avg Duration" value={sessionSummary.avgDuration} color="text-indigo-400" />
        </div>
      </div>

      {/* Agent list */}
      {session.agents.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>No agents in this session</p>
        </div>
      ) : (
        <div className="space-y-3">
          {session.agents.map((agent) => (
            <AgentCard key={agent.agent_id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function statusColor(status: string): string {
  switch (status) {
    case 'running':
      return 'bg-green-900/50 text-green-300';
    case 'idle':
      return 'bg-yellow-900/50 text-yellow-300';
    case 'completed':
      return 'bg-gray-800 text-gray-400';
    default:
      return 'bg-gray-800 text-gray-400';
  }
}

function getSessionSummary(session: SessionView) {
  const running = session.agents.filter((a) => a.status === 'running').length;
  const completed = session.agents.filter((a) => a.status === 'completed').length;
  const errors = session.agents.filter((a) => a.status === 'error').length;
  const durations = session.agents
    .filter((a) => a.duration_ms !== null)
    .map((a) => a.duration_ms as number);
  const avgMs =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  return {
    running,
    completed,
    errors,
    avgDuration: formatDuration(avgMs),
  };
}

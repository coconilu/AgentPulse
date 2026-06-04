import { useStore } from '../store';
import { StatusBadge } from './StatusBadge';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function shortPath(cwd: string): string {
  const parts = cwd.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || cwd;
}

export function SessionList() {
  const { sessions, selectedSessionId, selectSession } = useStore();

  return (
    <div className="custom-scrollbar h-full overflow-y-auto">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Sessions ({sessions.length})
        </h2>
      </div>
      <div className="space-y-1 p-2">
        {sessions.map((session) => (
          <button
            key={session.session_id}
            onClick={() => selectSession(session.session_id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              selectedSessionId === session.session_id
                ? 'bg-indigo-900/50 border border-indigo-500/50'
                : 'hover:bg-gray-800 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-200 truncate">
                {shortPath(session.cwd)}
              </span>
              <StatusBadge status={session.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{session.agents.length} agents</span>
              <span>{session.tool_calls_count} tools</span>
              <span>{timeAgo(session.last_event_at)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1 truncate font-mono">
              {session.session_id.slice(0, 8)}...
            </div>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No sessions yet. Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}

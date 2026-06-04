import { useStore } from '../store';

export function Header() {
  const wsConnected = useStore((s) => s.wsConnected);
  const followMode = useStore((s) => s.followMode);
  const setFollowMode = useStore((s) => s.setFollowMode);
  const sessions = useStore((s) => s.sessions);

  const runningCount = sessions.filter((s) => s.status === 'running').length;

  return (
    <header className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-gray-900">
      {/* Left - Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-200">AgentPulse</span>
        </div>
        <span className="text-xs text-gray-500">
          {sessions.length} sessions / {runningCount} running
        </span>
      </div>

      {/* Right - Controls */}
      <div className="flex items-center gap-4">
        {/* Follow mode toggle */}
        <button
          onClick={() => setFollowMode(!followMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            followMode
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Follow
        </button>

        {/* WebSocket status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
            }`}
          />
          <span className="text-xs text-gray-500">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}

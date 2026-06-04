import { useStore } from '../store';
import { StatusBadge } from './StatusBadge';
import { ToolTimeline } from './ToolTimeline';
import type { AgentView } from '../types';

interface AgentCardProps {
  agent: AgentView;
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

function agentTypeColor(agentType: string): string {
  const colors = [
    'bg-indigo-900/50 text-indigo-300 border-indigo-700',
    'bg-emerald-900/50 text-emerald-300 border-emerald-700',
    'bg-amber-900/50 text-amber-300 border-amber-700',
    'bg-rose-900/50 text-rose-300 border-rose-700',
    'bg-sky-900/50 text-sky-300 border-sky-700',
    'bg-purple-900/50 text-purple-300 border-purple-700',
  ];
  // Simple hash to get consistent color per type
  let hash = 0;
  for (let i = 0; i < agentType.length; i++) {
    hash = (hash * 31 + agentType.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AgentCard({ agent }: AgentCardProps) {
  const { selectedAgentId, selectAgent, expandedAgents, toggleAgentExpanded } =
    useStore();

  const isExpanded = expandedAgents.has(agent.agent_id);
  const isSelected = selectedAgentId === agent.agent_id;

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isSelected
          ? 'border-indigo-500/50 bg-indigo-900/10'
          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        {/* Expand toggle */}
        <button
          onClick={() => toggleAgentExpanded(agent.agent_id)}
          className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-transform"
          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Agent type badge */}
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded border ${agentTypeColor(agent.agent_type)}`}
        >
          {agent.agent_type}
        </span>

        {/* Agent ID */}
        <span className="text-sm text-gray-300 font-mono flex-1 truncate">
          {agent.agent_id.slice(0, 12)}...
        </span>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{agent.tool_calls.length} tools</span>
          <span>{formatDuration(agent.duration_ms)}</span>
          <span>{formatTime(agent.started_at)}</span>
        </div>

        {/* Status */}
        <StatusBadge status={agent.status} />

        {/* Select button for detail panel */}
        <button
          onClick={() => selectAgent(isSelected ? null : agent.agent_id)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            isSelected
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {isSelected ? 'Selected' : 'Details'}
        </button>
      </div>

      {/* Last message preview (collapsed) */}
      {!isExpanded && agent.last_assistant_message && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-500 line-clamp-2 pl-8">
            {agent.last_assistant_message}
          </p>
        </div>
      )}

      {/* Expanded content - Tool timeline */}
      {isExpanded && (
        <div className="border-t border-gray-800 px-4 py-3">
          <ToolTimeline toolCalls={agent.tool_calls} />

          {/* Last assistant message */}
          {agent.last_assistant_message && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Last Message
              </h4>
              <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {agent.last_assistant_message}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useStore } from '../store';
import { StatusBadge } from './StatusBadge';
import type { AgentView, ToolCallView } from '../types';

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

export function DetailPanel() {
  const { sessions, selectedSessionId, selectedAgentId, selectAgent } = useStore();

  const session = sessions.find((s) => s.session_id === selectedSessionId);
  const agent = session?.agents.find((a) => a.agent_id === selectedAgentId);

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center text-gray-600 p-4">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Click "Details" on an agent to see info here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-200">Agent Details</h3>
          <button
            onClick={() => selectAgent(null)}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-300 rounded hover:bg-gray-800"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-300">
            {agent.agent_type}
          </span>
          <StatusBadge status={agent.status} />
        </div>
        <div className="text-xs text-gray-500 font-mono mb-1">{agent.agent_id}</div>

        {/* Agent stats */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <DetailStat label="Duration" value={formatDuration(agent.duration_ms)} />
          <DetailStat label="Tool Calls" value={agent.tool_calls.length.toString()} />
          <DetailStat label="Started" value={formatTime(agent.started_at)} />
        </div>
        {agent.completed_at && (
          <div className="mt-2 text-xs text-gray-500">
            Completed at {formatTime(agent.completed_at)}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Last assistant message */}
        {agent.last_assistant_message && (
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Last Assistant Message
            </h4>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {agent.last_assistant_message}
              </p>
            </div>
          </section>
        )}

        {/* Tool call details */}
        {agent.tool_calls.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">
              Tool Call Details ({agent.tool_calls.length})
            </h4>
            <div className="space-y-3">
              {agent.tool_calls.map((call) => (
                <ToolCallDetail key={call.id} call={call} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded px-2 py-1.5 border border-gray-800">
      <div className="text-xs font-medium text-gray-300">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}

function ToolCallDetail({ call }: { call: ToolCallView }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-gray-900/50 transition-colors text-left"
      >
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-sm font-medium text-gray-300">{call.tool_name}</span>
        <StatusBadge status={call.status} />
        <span className="text-xs text-gray-600 ml-auto flex-shrink-0">
          {formatTime(call.timestamp)}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-800 p-3 space-y-3">
          {/* Input */}
          <div>
            <h5 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
              Input
            </h5>
            <pre className="text-xs text-gray-400 bg-gray-950 rounded p-2 border border-gray-800 overflow-x-auto">
              {JSON.stringify(call.tool_input, null, 2)}
            </pre>
          </div>

          {/* Response */}
          {call.tool_response !== null && (
            <div>
              <h5 className="text-[10px] font-semibold text-gray-500 uppercase mb-1">
                Response
              </h5>
              <pre className="text-xs text-gray-400 bg-gray-950 rounded p-2 border border-gray-800 overflow-x-auto max-h-64">
                {typeof call.tool_response === 'string'
                  ? call.tool_response.length > 2000
                    ? call.tool_response.slice(0, 2000) + '\n... (truncated)'
                    : call.tool_response
                  : JSON.stringify(call.tool_response, null, 2).slice(0, 2000)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

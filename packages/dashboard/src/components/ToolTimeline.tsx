import { StatusBadge } from './StatusBadge';
import type { ToolCallView } from '../types';

interface ToolTimelineProps {
  toolCalls: ToolCallView[];
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function toolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    Read: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    Write: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    Edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    Bash: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    Glob: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    Grep: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    WebFetch: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
    WebSearch: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    Task: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  };
  return icons[toolName] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
}

export function ToolTimeline({ toolCalls }: ToolTimelineProps) {
  if (toolCalls.length === 0) {
    return (
      <div className="text-center text-gray-600 py-4 text-sm">
        No tool calls recorded
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">
        Tool Calls ({toolCalls.length})
      </h4>
      <div className="space-y-2">
        {toolCalls.map((call) => (
          <ToolCallItem key={call.id} call={call} />
        ))}
      </div>
    </div>
  );
}

function ToolCallItem({ call }: { call: ToolCallView }) {
  return (
    <div className="flex items-start gap-3 group">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1">
        <div
          className={`w-6 h-6 rounded flex items-center justify-center ${
            call.status === 'completed'
              ? 'bg-gray-800'
              : call.status === 'failed'
                ? 'bg-red-900/50'
                : 'bg-indigo-900/50'
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={toolIcon(call.tool_name)} />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-300">{call.tool_name}</span>
          <StatusBadge status={call.status} />
          <span className="text-xs text-gray-600">{formatTime(call.timestamp)}</span>
        </div>

        {/* Tool input summary */}
        {call.tool_input && Object.keys(call.tool_input).length > 0 && (
          <div className="bg-gray-950 rounded px-3 py-2 border border-gray-800 mb-1">
            <ToolInputSummary input={call.tool_input} />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolInputSummary({ input }: { input: Record<string, unknown> }) {
  // Show a concise summary of tool input
  const entries = Object.entries(input);
  if (entries.length === 0) return null;

  // For file-related tools, show the path prominently
  const filePath = input.file_path || input.path || input.filePath;
  const pattern = input.pattern || input.query;
  const command = input.command;

  if (filePath) {
    const pathStr = String(filePath);
    const shortPath = pathStr.split('/').slice(-2).join('/');
    return (
      <code className="text-xs text-gray-400">
        <span className="text-gray-600">.../</span>
        {shortPath}
      </code>
    );
  }

  if (pattern) {
    return <code className="text-xs text-gray-400">{String(pattern)}</code>;
  }

  if (command) {
    const cmdStr = String(command);
    return (
      <code className="text-xs text-gray-400 font-mono">
        {cmdStr.length > 60 ? cmdStr.slice(0, 60) + '...' : cmdStr}
      </code>
    );
  }

  // Generic fallback - show first key-value pair
  const [key, value] = entries[0];
  const valStr = typeof value === 'string' ? value : JSON.stringify(value);
  return (
    <code className="text-xs text-gray-400">
      <span className="text-gray-500">{key}:</span>{' '}
      {valStr.length > 50 ? valStr.slice(0, 50) + '...' : valStr}
    </code>
  );
}

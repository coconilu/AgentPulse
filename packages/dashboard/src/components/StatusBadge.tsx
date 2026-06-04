interface StatusBadgeProps {
  status: 'running' | 'idle' | 'completed' | 'error' | 'pending' | 'failed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    running: { color: 'bg-green-500', animate: 'animate-pulse', label: 'Running' },
    idle: { color: 'bg-yellow-500', animate: '', label: 'Idle' },
    completed: { color: 'bg-gray-400', animate: '', label: 'Done' },
    error: { color: 'bg-red-500', animate: '', label: 'Error' },
    pending: { color: 'bg-blue-400', animate: 'animate-pulse', label: 'Pending' },
    failed: { color: 'bg-red-500', animate: '', label: 'Failed' },
  };

  const c = config[status];

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${c.color} ${c.animate}`} />
      <span className="text-xs text-gray-500">{c.label}</span>
    </span>
  );
}

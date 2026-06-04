import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionList } from '../SessionList';
import { useStore } from '../../store';

// Mock the store
vi.mock('../../store', () => ({
  useStore: vi.fn(),
}));

describe('SessionList', () => {
  const mockSelectSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no sessions', () => {
    (useStore as any).mockReturnValue({
      sessions: [],
      selectedSessionId: null,
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument();
    expect(screen.getByText(/Waiting for events/)).toBeInTheDocument();
  });

  it('should render session count in header', () => {
    const mockSessions = [
      {
        session_id: 'sess-001',
        cwd: '/test/project',
        started_at: '2026-06-04T09:00:00.000Z',
        last_event_at: '2026-06-04T09:05:00.000Z',
        status: 'running' as const,
        agents: [],
        tool_calls_count: 3,
        tasks_count: 1,
      },
    ];

    (useStore as any).mockReturnValue({
      sessions: mockSessions,
      selectedSessionId: null,
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    expect(screen.getByText(/sessions \(1\)/i)).toBeInTheDocument();
  });

  it('should render session items', () => {
    const mockSessions = [
      {
        session_id: 'sess-001',
        cwd: '/test/project',
        started_at: '2026-06-04T09:00:00.000Z',
        last_event_at: '2026-06-04T09:05:00.000Z',
        status: 'running' as const,
        agents: [{ agent_id: 'a1', agent_type: 'explorer' }],
        tool_calls_count: 3,
        tasks_count: 1,
      },
    ];

    (useStore as any).mockReturnValue({
      sessions: mockSessions,
      selectedSessionId: null,
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    // Should show project name (last part of path)
    expect(screen.getByText('project')).toBeInTheDocument();

    // Should show stats
    expect(screen.getByText('1 agents')).toBeInTheDocument();
    expect(screen.getByText('3 tools')).toBeInTheDocument();
  });

  it('should call selectSession on click', () => {
    const mockSessions = [
      {
        session_id: 'sess-001',
        cwd: '/test/project',
        started_at: '2026-06-04T09:00:00.000Z',
        last_event_at: '2026-06-04T09:05:00.000Z',
        status: 'running' as const,
        agents: [],
        tool_calls_count: 0,
        tasks_count: 0,
      },
    ];

    (useStore as any).mockReturnValue({
      sessions: mockSessions,
      selectedSessionId: null,
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSelectSession).toHaveBeenCalledWith('sess-001');
  });

  it('should highlight selected session', () => {
    const mockSessions = [
      {
        session_id: 'sess-001',
        cwd: '/test/project',
        started_at: '2026-06-04T09:00:00.000Z',
        last_event_at: '2026-06-04T09:05:00.000Z',
        status: 'running' as const,
        agents: [],
        tool_calls_count: 0,
        tasks_count: 0,
      },
    ];

    (useStore as any).mockReturnValue({
      sessions: mockSessions,
      selectedSessionId: 'sess-001',
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-indigo-900/50');
  });

  it('should format time ago correctly', () => {
    const now = new Date();
    const recentTime = new Date(now.getTime() - 45000).toISOString(); // 45 seconds ago

    const mockSessions = [
      {
        session_id: 'sess-001',
        cwd: '/test',
        started_at: recentTime,
        last_event_at: recentTime,
        status: 'running' as const,
        agents: [],
        tool_calls_count: 0,
        tasks_count: 0,
      },
    ];

    (useStore as any).mockReturnValue({
      sessions: mockSessions,
      selectedSessionId: null,
      selectSession: mockSelectSession,
    });

    render(<SessionList />);

    // Should show "45s ago" or similar
    expect(screen.getByText(/ago$/)).toBeInTheDocument();
  });
});

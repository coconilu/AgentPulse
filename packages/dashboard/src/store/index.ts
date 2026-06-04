import { create } from 'zustand';
import type { SessionView, AgentPulseEvent } from '../types';

interface AgentPulseStore {
  sessions: SessionView[];
  selectedSessionId: string | null;
  selectedAgentId: string | null;
  expandedAgents: Set<string>;
  wsConnected: boolean;
  followMode: boolean;

  setInitialState: (sessions: SessionView[]) => void;
  handleSessionUpdate: (session: SessionView) => void;
  handleEvent: (event: AgentPulseEvent) => void;
  selectSession: (id: string | null) => void;
  selectAgent: (id: string | null) => void;
  toggleAgentExpanded: (id: string) => void;
  setWsConnected: (connected: boolean) => void;
  setFollowMode: (enabled: boolean) => void;
}

export const useStore = create<AgentPulseStore>((set, get) => ({
  sessions: [],
  selectedSessionId: null,
  selectedAgentId: null,
  expandedAgents: new Set(),
  wsConnected: false,
  followMode: true,

  setInitialState: (sessions) => {
    set({ sessions });
    // Auto-select first session if in follow mode
    if (get().followMode && sessions.length > 0) {
      set({ selectedSessionId: sessions[0].session_id });
    }
  },

  handleSessionUpdate: (updatedSession) => {
    set((state) => {
      const idx = state.sessions.findIndex(
        (s) => s.session_id === updatedSession.session_id
      );
      let newSessions: SessionView[];
      if (idx >= 0) {
        newSessions = [...state.sessions];
        newSessions[idx] = updatedSession;
      } else {
        newSessions = [updatedSession, ...state.sessions];
      }
      // Sort by last_event_at desc
      newSessions.sort(
        (a, b) =>
          new Date(b.last_event_at).getTime() - new Date(a.last_event_at).getTime()
      );

      const updates: Partial<AgentPulseStore> = { sessions: newSessions };
      // Follow mode: auto-select newest active
      if (state.followMode && updatedSession.status === 'running') {
        updates.selectedSessionId = updatedSession.session_id;
      }
      return updates;
    });
  },

  handleEvent: (_event) => {
    // Events are handled via session_update; this is for potential future use
  },

  selectSession: (id) => set({ selectedSessionId: id, selectedAgentId: null }),
  selectAgent: (id) => set({ selectedAgentId: id }),

  toggleAgentExpanded: (id) => {
    set((state) => {
      const expanded = new Set(state.expandedAgents);
      if (expanded.has(id)) {
        expanded.delete(id);
      } else {
        expanded.add(id);
      }
      return { expandedAgents: expanded };
    });
  },

  setWsConnected: (connected) => set({ wsConnected: connected }),
  setFollowMode: (enabled) => set({ followMode: enabled }),
}));

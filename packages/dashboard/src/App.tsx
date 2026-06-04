import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store';
import { Header } from './components/Header';
import { SessionList } from './components/SessionList';
import { AgentTree } from './components/AgentTree';
import { DetailPanel } from './components/DetailPanel';

export default function App() {
  useWebSocket();
  const selectedSessionId = useStore((s) => s.selectedSessionId);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Session list */}
        <aside className="w-72 border-r border-gray-800 flex-shrink-0 overflow-hidden flex flex-col">
          <SessionList />
        </aside>

        {/* Center - Agent tree */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {selectedSessionId ? (
            <AgentTree sessionId={selectedSessionId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-600">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg">Select a session to view agents</p>
              </div>
            </div>
          )}
        </main>

        {/* Right sidebar - Detail panel */}
        <aside className="w-96 border-l border-gray-800 flex-shrink-0 overflow-hidden">
          <DetailPanel />
        </aside>
      </div>
    </div>
  );
}

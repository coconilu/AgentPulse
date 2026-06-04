# AgentPulse

## Context

Claude Code TUI cannot display sub-agent work effectively. AgentPulse is a real-time Web Dashboard showing all sub-agents' status, progress and results, with disk persistence ensuring no data loss even when the server is offline.

## Architecture

`
Claude Code Hook (async)
  |-- Always write to ~/.agentpulse/events/YYYY-MM-DD.jsonl (persist)
  |-- Try POST to http://127.0.0.1:7888/api/events
                         |
         +---------------+---------------+
         |   Node.js Event Hub (Fastify) |
         |   + file watcher fallback     |
         |   + SessionManager aggregate  |
         +---------------+---------------+
                         | WebSocket
                         v
              React Dashboard (Vite)
`

## Project Structure

`
agentpulse/
+-- package.json                  # monorepo (workspaces)
+-- packages/
    +-- shared/src/events.ts      # Unified event TypeScript types
    +-- hook/src/agentpulse-hook.ts  # Hook script (compiled to zero-dep single file)
    +-- server/src/               # Fastify + WebSocket backend
    |   +-- index.ts, http.ts, websocket.ts
    |   +-- storage.ts            # JSONL read/watch
    |   +-- session-manager.ts    # Event aggregation
    +-- dashboard/src/            # React + Vite + TailwindCSS frontend
        +-- store/index.ts        # Zustand state
        +-- hooks/useWebSocket.ts
        +-- components/           # SessionList, AgentTree, AgentCard, DetailPanel
`

## Core Design

### 1. Hook Script (zero deps, async, non-blocking)
- Read stdin JSON -> normalize to AgentPulseEvent
- ALWAYS appendFile to ~/.agentpulse/events/YYYY-MM-DD.jsonl
- TRY POST to server (fire-and-forget, silent on failure)
- Compiled with esbuild to single JS file

### 2. Hook Events
| Event | Key Data |
|-------|----------|
| SubagentStart | agent_id, agent_type |
| SubagentStop | agent_id, agent_type, last_assistant_message |
| PreToolUse | tool_name, tool_input, agent_id |
| PostToolUse | tool_name, tool_response, agent_id |
| TaskCreated | task_id, task_subject |
| TaskCompleted | task_id |

### 3. Backend (Fastify + ws + chokidar)
- On startup: scan JSONL files to build in-memory state
- POST /api/events: receive events -> dedup -> aggregate -> WebSocket broadcast
- chokidar: watch file changes as fallback
- REST API: GET /sessions, GET /sessions/:id
- WebSocket: send initial_state on connect, push incremental events

### 4. Frontend (React + Zustand)
- SessionList: left sidebar, sorted by time desc, status indicators
- AgentTree: tree view of parent -> sub-agent relationships
- AgentCard: expandable, shows status/duration/tool call count
- ToolTimeline: tool call timeline when expanded
- DetailPanel: full last_assistant_message + formatted JSON
- Follow mode: auto-track latest active session

### 5. Dedup Strategy
- Each event has unique id (timestamp + random)
- SessionManager maintains processed ID Set
- POST source and file watcher source won't duplicate

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Hook | Node.js native API (fs, http), esbuild bundle |
| Backend | Fastify 5 + @fastify/websocket + chokidar 4 |
| Frontend | React 19 + Vite 6 + TailwindCSS 4 + Zustand 5 |
| Types | TypeScript 5.7, shared between frontend and backend |

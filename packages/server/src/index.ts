import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { homedir } from 'os';
import { join } from 'path';
import type { AgentPulseEvent } from '@agentpulse/shared';
import { EventStorage } from './storage.js';
import { SessionManager } from './session-manager.js';
import { WebSocketHub } from './websocket.js';

const PORT = 7888;
const EVENTS_DIR = join(homedir(), '.agentpulse', 'events');

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  // Initialize components
  const storage = new EventStorage(EVENTS_DIR);
  const sessionManager = new SessionManager();
  const wsHub = new WebSocketHub();

  // Load historical events
  console.log(`Loading events from ${EVENTS_DIR}...`);
  const historicalEvents = storage.loadAll();
  sessionManager.processEvents(historicalEvents);
  console.log(
    `Loaded ${historicalEvents.length} events, ${sessionManager.getAllSessions().length} sessions`
  );

  // Watch for file changes (fallback for when POST fails)
  storage.watchForChanges((newEvents) => {
    for (const event of newEvents) {
      const session = sessionManager.processEvent(event);
      if (session) {
        wsHub.broadcast({ type: 'event', payload: event });
        wsHub.broadcast({ type: 'session_update', payload: session });
      }
    }
  });

  // REST: receive events from hook
  app.post<{ Body: AgentPulseEvent }>('/api/events', async (request, reply) => {
    const event = request.body as AgentPulseEvent;

    if (!event || !event.id || !event.hook_event_name) {
      return reply.status(400).send({ error: 'Invalid event' });
    }

    const session = sessionManager.processEvent(event);
    if (session) {
      wsHub.broadcast({ type: 'event', payload: event });
      wsHub.broadcast({ type: 'session_update', payload: session });
    }

    return { ok: true };
  });

  // REST: get all sessions
  app.get('/api/sessions', async () => {
    return sessionManager.getAllSessions();
  });

  // REST: get single session
  app.get<{ Params: { id: string } }>('/api/sessions/:id', async (request, reply) => {
    const session = sessionManager.getSession(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }
    return session;
  });

  // REST: health check
  app.get('/api/health', async () => {
    return {
      status: 'ok',
      sessions: sessionManager.getAllSessions().length,
      wsClients: wsHub.clientCount,
    };
  });

  // WebSocket endpoint
  app.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (socket) => {
      wsHub.addClient(socket, sessionManager.getAllSessions());
    });
  });

  // Start heartbeat
  wsHub.startHeartbeat(30000);

  // Start server
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`AgentPulse server running on http://localhost:${PORT}`);
    console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();

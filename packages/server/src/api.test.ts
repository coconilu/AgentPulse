import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { AgentPulseEvent } from '@agentpulse/shared';
import { EventStorage } from './storage';
import { SessionManager } from './session-manager';
import { WebSocketHub } from './websocket';

describe('API Endpoints', () => {
  let app: any;
  let storage: EventStorage;
  let sessionManager: SessionManager;
  let wsHub: WebSocketHub;
  let testDir: string;

  beforeEach(async () => {
    // Create test app
    app = Fastify({ logger: false });
    await app.register(cors, { origin: true });
    await app.register(websocket);

    // Initialize components with temp directory
    const tmpdir = require('os').tmpdir();
    testDir = `${tmpdir}/agentpulse-api-test-${Date.now()}`;
    storage = new EventStorage(testDir);
    sessionManager = new SessionManager();
    wsHub = new WebSocketHub();

    // Register routes
    app.post<{ Body: AgentPulseEvent }>('/api/events', async (request: any, reply: any) => {
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

    app.get('/api/sessions', async () => {
      return sessionManager.getAllSessions();
    });

    app.get<{ Params: { id: string } }>('/api/sessions/:id', async (request: any, reply: any) => {
      const session = sessionManager.getSession(request.params.id);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }
      return session;
    });

    app.get('/api/health', async () => {
      return {
        status: 'ok',
        sessions: sessionManager.getAllSessions().length,
        wsClients: wsHub.clientCount,
      };
    });

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    wsHub.stop();

    // Cleanup temp directory
    try {
      const fs = require('fs');
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
  });

  describe('POST /api/events', () => {
    it('should accept valid SubagentStart event', async () => {
      const event: AgentPulseEvent = {
        id: 'e1',
        timestamp: '2026-06-04T09:00:00.000Z',
        hook_event_name: 'SubagentStart',
        session_id: 'sess-001',
        cwd: '/test',
        agent_id: 'a1',
        agent_type: 'explorer',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: event,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ ok: true });
    });

    it('should reject invalid event', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: { invalid: 'data' },
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
    });

    it('should aggregate events into sessions', async () => {
      // Send multiple events
      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e1',
          timestamp: '2026-06-04T09:00:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 'sess-001',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
        } as AgentPulseEvent,
      });

      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e2',
          timestamp: '2026-06-04T09:01:00.000Z',
          hook_event_name: 'PreToolUse',
          session_id: 'sess-001',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
          tool_name: 'Read',
          tool_input: {},
        } as AgentPulseEvent,
      });

      const sessionsResponse = await app.inject({
        method: 'GET',
        url: '/api/sessions',
      });

      const sessions = JSON.parse(sessionsResponse.payload);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].agents).toHaveLength(1);
      expect(sessions[0].tool_calls_count).toBe(1);
    });
  });

  describe('GET /api/sessions', () => {
    it('should return empty array when no sessions', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sessions',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual([]);
    });

    it('should return all sessions sorted by time', async () => {
      // Create two sessions
      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e1',
          timestamp: '2026-06-04T09:00:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 'sess-001',
          cwd: '/test1',
          agent_id: 'a1',
          agent_type: 'explorer',
        } as AgentPulseEvent,
      });

      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e2',
          timestamp: '2026-06-04T09:05:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 'sess-002',
          cwd: '/test2',
          agent_id: 'a2',
          agent_type: 'reviewer',
        } as AgentPulseEvent,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/sessions',
      });

      const sessions = JSON.parse(response.payload);
      expect(sessions).toHaveLength(2);
      expect(sessions[0].session_id).toBe('sess-002'); // Most recent first
      expect(sessions[1].session_id).toBe('sess-001');
    });
  });

  describe('GET /api/sessions/:id', () => {
    it('should return session by ID', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e1',
          timestamp: '2026-06-04T09:00:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 'sess-001',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
        } as AgentPulseEvent,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/sessions/sess-001',
      });

      expect(response.statusCode).toBe(200);
      const session = JSON.parse(response.payload);
      expect(session.session_id).toBe('sess-001');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/sessions/non-existent',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
      const health = JSON.parse(response.payload);
      expect(health.status).toBe('ok');
      expect(health.sessions).toBe(0);
      expect(health.wsClients).toBe(0);
    });

    it('should count active sessions', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          id: 'e1',
          timestamp: '2026-06-04T09:00:00.000Z',
          hook_event_name: 'SubagentStart',
          session_id: 'sess-001',
          cwd: '/test',
          agent_id: 'a1',
          agent_type: 'explorer',
        } as AgentPulseEvent,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      const health = JSON.parse(response.payload);
      expect(health.sessions).toBe(1);
    });
  });
});

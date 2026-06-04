import type { WebSocket } from 'ws';
import type { WSMessage, SessionView } from '@agentpulse/shared';

export class WebSocketHub {
  private clients: Set<WebSocket> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  addClient(ws: WebSocket, initialState: SessionView[]): void {
    this.clients.add(ws);

    // Send initial state
    const msg: WSMessage = { type: 'initial_state', payload: initialState };
    ws.send(JSON.stringify(msg));

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'pong') {
          // client is alive
        }
      } catch {
        // ignore
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', () => {
      this.clients.delete(ws);
    });
  }

  broadcast(message: WSMessage): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === 1) {
        // OPEN
        client.send(data);
      }
    }
  }

  startHeartbeat(intervalMs: number = 30000): void {
    this.heartbeatInterval = setInterval(() => {
      const ping: WSMessage = { type: 'ping' };
      const data = JSON.stringify(ping);
      for (const client of this.clients) {
        if (client.readyState === 1) {
          client.send(data);
        } else {
          this.clients.delete(client);
        }
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

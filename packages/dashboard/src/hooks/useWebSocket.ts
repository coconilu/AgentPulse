import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import type { WSMessage } from '../types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const backoff = useRef(1000);

  const { setInitialState, handleSessionUpdate, handleEvent, setWsConnected } =
    useStore();

  useEffect(() => {
    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        backoff.current = 1000;
      };

      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        // Reconnect with exponential backoff
        reconnectTimer.current = setTimeout(() => {
          backoff.current = Math.min(backoff.current * 2, 30000);
          connect();
        }, backoff.current);
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          switch (msg.type) {
            case 'initial_state':
              setInitialState(msg.payload);
              break;
            case 'session_update':
              handleSessionUpdate(msg.payload);
              break;
            case 'event':
              handleEvent(msg.payload);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch {
          // ignore parse errors
        }
      };
    }

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [setInitialState, handleSessionUpdate, handleEvent, setWsConnected]);
}

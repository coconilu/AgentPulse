import '@testing-library/jest-dom';

// Mock window.location for tests
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'http:',
    host: 'localhost:5173',
  },
  writable: true,
});

// Mock WebSocket for tests
class MockWebSocket {
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;

  constructor(url: string) {
    // Simulate connection
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose();
  }
}

(global as any).WebSocket = MockWebSocket;

import { homedir } from 'os';
import { join } from 'path';
export const DEFAULT_PORT = 7888;
export const EVENTS_DIR = join(homedir(), '.agentpulse', 'events');
export const WS_HEARTBEAT_INTERVAL = 30000;
export const SESSION_IDLE_TIMEOUT = 300000; // 5 min
export const SESSION_RUNNING_THRESHOLD = 30000; // 30s
//# sourceMappingURL=constants.js.map
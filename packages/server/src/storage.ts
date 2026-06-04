import { readFileSync, readdirSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';
import { watch } from 'chokidar';
import type { AgentPulseEvent } from '@agentpulse/shared';

export class EventStorage {
  private eventsDir: string;
  private filePositions: Map<string, number> = new Map();
  private onNewEvents?: (events: AgentPulseEvent[]) => void;

  constructor(eventsDir: string) {
    this.eventsDir = eventsDir;
    mkdirSync(eventsDir, { recursive: true });
  }

  /** Load all events from all JSONL files */
  loadAll(): AgentPulseEvent[] {
    const events: AgentPulseEvent[] = [];
    let files: string[];

    try {
      files = readdirSync(this.eventsDir)
        .filter((f) => f.endsWith('.jsonl'))
        .sort();
    } catch {
      return events;
    }

    for (const file of files) {
      const filePath = join(this.eventsDir, file);
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter((l) => l.trim());
        for (const line of lines) {
          try {
            events.push(JSON.parse(line) as AgentPulseEvent);
          } catch {
            // skip malformed lines
          }
        }
        // Track file position for incremental reads
        const stat = statSync(filePath);
        this.filePositions.set(filePath, stat.size);
      } catch {
        // skip unreadable files
      }
    }

    return events;
  }

  /** Read only new events from a file (since last known position) */
  readNewFromFile(filePath: string): AgentPulseEvent[] {
    const events: AgentPulseEvent[] = [];
    const lastPos = this.filePositions.get(filePath) || 0;

    try {
      const stat = statSync(filePath);
      if (stat.size <= lastPos) return events;

      const content = readFileSync(filePath, 'utf-8');
      const allBytes = Buffer.from(content);
      const newContent = allBytes.slice(lastPos).toString('utf-8');
      const lines = newContent.split('\n').filter((l) => l.trim());

      for (const line of lines) {
        try {
          events.push(JSON.parse(line) as AgentPulseEvent);
        } catch {
          // skip malformed
        }
      }

      this.filePositions.set(filePath, stat.size);
    } catch {
      // file read error
    }

    return events;
  }

  /** Watch for file changes and emit new events */
  watchForChanges(callback: (events: AgentPulseEvent[]) => void): void {
    this.onNewEvents = callback;

    const watcher = watch(this.eventsDir, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    watcher.on('add', (filePath) => {
      if (filePath.endsWith('.jsonl')) {
        const events = this.readNewFromFile(filePath);
        if (events.length > 0 && this.onNewEvents) {
          this.onNewEvents(events);
        }
      }
    });

    watcher.on('change', (filePath) => {
      if (filePath.endsWith('.jsonl')) {
        const events = this.readNewFromFile(filePath);
        if (events.length > 0 && this.onNewEvents) {
          this.onNewEvents(events);
        }
      }
    });
  }
}

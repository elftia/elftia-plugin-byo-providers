/** Structural subset of the current host contract (the pinned SDK predates it). */
export interface LogJevSettings {
  kind: 'chat' | 'jev';
  upstream?: { kind: 'provider'; id: string; model: string };
  promptMode?: 'full' | 'minimal';
  topk?: number;
  readTemperature?: number;
  concurrency?: number;
  timeoutMs?: number;
  retryDelaysMs?: number[];
  extraBody?: Record<string, unknown>;
}

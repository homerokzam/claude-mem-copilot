import type { WorkerConfig } from "../types.js";

export function getWorkerConfig(env: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const host = env.CLAUDE_MEM_WORKER_HOST ?? "127.0.0.1";
  const port = env.CLAUDE_MEM_WORKER_PORT ?? "37777";
  const protocol = env.CLAUDE_MEM_WORKER_PROTOCOL ?? "http";
  const baseUrl = env.CLAUDE_MEM_WORKER_URL ?? `${protocol}://${host}:${port}`;
  const timeoutMs = Number(env.CLAUDE_MEM_TIMEOUT_MS ?? "10000");

  return {
    host,
    port,
    baseUrl: baseUrl.replace(/\/$/, ""),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000
  };
}

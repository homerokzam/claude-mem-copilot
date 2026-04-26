import { getWorkerConfig } from "./config/workerConfig.js";
import type { JsonObject, WorkerConfig } from "./types.js";

export class ClaudeMemError extends Error {
  constructor(message: string, readonly status?: number, readonly details?: unknown) {
    super(message);
    this.name = "ClaudeMemError";
  }
}

export type ClaudeMemClientOptions = {
  config?: WorkerConfig;
  fetchImpl?: typeof fetch;
};

export class ClaudeMemClient {
  readonly config: WorkerConfig;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ClaudeMemClientOptions = {}) {
    this.config = options.config ?? getWorkerConfig();
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async health(): Promise<unknown> {
    try {
      return await this.request("/api/health");
    } catch (error) {
      if (error instanceof ClaudeMemError && (error.status === 404 || error.status === 405)) {
        return this.request("/health");
      }
      throw error;
    }
  }

  async projects(): Promise<unknown> {
    return this.request("/api/projects");
  }

  async search(params: JsonObject): Promise<unknown> {
    return this.request("/api/search", { query: params });
  }

  async timeline(params: JsonObject): Promise<unknown> {
    return this.request("/api/timeline", { query: params });
  }

  async getObservations(params: JsonObject): Promise<unknown> {
    return this.request("/api/observations/batch", { method: "POST", body: params });
  }

  async recentContext(params: JsonObject = {}): Promise<unknown> {
    return this.request("/api/context/recent", { query: params });
  }

  async injectedContext(params: JsonObject = {}): Promise<unknown> {
    try {
      return await this.request("/api/context/inject", { query: params });
    } catch (error) {
      if (error instanceof ClaudeMemError && (error.status === 404 || error.status === 405)) {
        return this.recentContext(params);
      }
      throw error;
    }
  }

  async initSession(body: JsonObject): Promise<unknown> {
    return this.request("/api/sessions/init", { method: "POST", body });
  }

  async addObservation(body: JsonObject): Promise<unknown> {
    return this.request("/api/sessions/observations", { method: "POST", body });
  }

  async summarizeSession(body: JsonObject): Promise<unknown> {
    return this.request("/api/sessions/summarize", { method: "POST", body });
  }

  async completeSession(body: JsonObject): Promise<unknown> {
    return this.request("/api/sessions/complete", { method: "POST", body });
  }

  private async request(path: string, options: { method?: string; query?: JsonObject; body?: JsonObject } = {}): Promise<unknown> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          if (item !== undefined && item !== null) {
            url.searchParams.append(key, String(item));
          }
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetchImpl(url, {
        method: options.method ?? "GET",
        headers: options.body ? { "content-type": "application/json" } : undefined,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      const text = await response.text();
      const parsed = parseResponseBody(text);
      if (!response.ok) {
        throw new ClaudeMemError(`Claude-Mem worker returned HTTP ${response.status}`, response.status, parsed);
      }
      return parsed;
    } catch (error) {
      if (error instanceof ClaudeMemError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ClaudeMemError(`Claude-Mem worker timed out after ${this.config.timeoutMs}ms`, undefined, { path });
      }
      throw new ClaudeMemError("Could not reach Claude-Mem worker", undefined, error instanceof Error ? error.message : String(error));
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseResponseBody(text: string): unknown {
  if (!text.trim()) {
    return { ok: true };
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { optionalString } from "./util.js";

export type SessionState = {
  lastContentSessionId?: string;
  updatedAt?: string;
};

const stateDir = join(homedir(), ".claude-mem-copilot");
const statePath = join(stateDir, "session-state.json");

export function deriveContentSessionId(input: {
  sessionId?: unknown;
  workspace?: unknown;
  project?: unknown;
  date?: Date;
} = {}): string {
  const explicitSessionId = optionalString(input.sessionId);
  if (explicitSessionId) {
    return `vscode-copilot:${explicitSessionId}`;
  }

  const workspace = optionalString(input.workspace) ?? optionalString(input.project) ?? process.cwd();
  const hash = createHash("sha256").update(workspace).digest("hex").slice(0, 12);
  const day = (input.date ?? new Date()).toISOString().slice(0, 10);
  return `vscode-copilot:${hash}:${day}`;
}

export async function readSessionState(): Promise<SessionState> {
  try {
    return JSON.parse(await readFile(statePath, "utf8")) as SessionState;
  } catch {
    return {};
  }
}

export async function writeSessionState(state: SessionState): Promise<void> {
  await mkdir(stateDir, { recursive: true });
  await writeFile(statePath, `${JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
}

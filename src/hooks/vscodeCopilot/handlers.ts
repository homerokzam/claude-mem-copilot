import { ClaudeMemClient } from "../../claudeMemClient.js";
import { deriveContentSessionId, writeSessionState } from "../../sessionState.js";
import type { JsonObject, VscodeCopilotHookInput } from "../../types.js";
import { asRecord, optionalString, truncateText } from "../../util.js";

const platformSource = "vscode-copilot";

type HookEvent = "SessionStart" | "PreToolUse" | "PostToolUse" | "PreCompact";

export async function handleVscodeCopilotHook(eventName: string, input: VscodeCopilotHookInput): Promise<unknown> {
  const normalized = normalizeEventName(eventName);
  switch (normalized) {
    case "SessionStart":
      return handleSessionStart(input);
    case "PreToolUse":
      return handlePreToolUse(input);
    case "PostToolUse":
      return handlePostToolUse(input);
    case "PreCompact":
      return handlePreCompact(input);
    default:
      return {};
  }
}

async function handleSessionStart(input: VscodeCopilotHookInput): Promise<unknown> {
  const client = new ClaudeMemClient();
  const contentSessionId = contentSessionIdFromHook(input);
  await writeSessionState({ lastContentSessionId: contentSessionId });

  try {
    const context = await client.injectedContext({
      project: projectFromHook(input),
      contentSessionId,
      source: platformSource,
      reason: input.reason
    });

    return hookContextOutput("SessionStart", formatAdditionalContext(context));
  } catch (error) {
    return hookContextOutput("SessionStart", `Claude-Mem is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function handlePreToolUse(input: VscodeCopilotHookInput): Promise<unknown> {
  if (String(input.tool_name ?? "").startsWith("cmem_")) {
    return {};
  }

  return hookContextOutput(
    "PreToolUse",
    "Claude-Mem project memory is available through cmem_search and cmem_recent_context. Use it when the task depends on prior project decisions or history."
  );
}

async function handlePostToolUse(input: VscodeCopilotHookInput): Promise<unknown> {
  const toolName = optionalString(input.tool_name);
  if (!toolName || toolName.startsWith("cmem_")) {
    return {};
  }

  const client = new ClaudeMemClient();
  const contentSessionId = contentSessionIdFromHook(input);
  const project = projectFromHook(input);
  const body: JsonObject = {
    contentSessionId,
    claudeSessionId: contentSessionId,
    platformSource,
    project,
    tool_name: toolName,
    tool_input: sanitizeHookPayload(input.tool_input),
    tool_response: sanitizeHookPayload(input.tool_response ?? input.tool_output),
    is_error: Boolean(input.is_error)
  };

  try {
    await client.initSession({
      contentSessionId,
      claudeSessionId: contentSessionId,
      platformSource,
      project,
      prompt: "VS Code Copilot tool activity"
    });
    await client.addObservation(body);
    await writeSessionState({ lastContentSessionId: contentSessionId });
    return {};
  } catch {
    return {};
  }
}

async function handlePreCompact(input: VscodeCopilotHookInput): Promise<unknown> {
  const client = new ClaudeMemClient();
  const contentSessionId = contentSessionIdFromHook(input);
  try {
    const summary = await client.summarizeSession({
      contentSessionId,
      claudeSessionId: contentSessionId,
      platformSource,
      project: projectFromHook(input),
      last_assistant_message: optionalString(input.prompt) ?? "VS Code Copilot pre-compact snapshot"
    });
    return hookContextOutput("PreCompact", formatAdditionalContext(summary));
  } catch {
    return {};
  }
}

function hookContextOutput(hookEventName: HookEvent, additionalContext: string): unknown {
  return {
    hookSpecificOutput: {
      hookEventName,
      additionalContext
    }
  };
}

function contentSessionIdFromHook(input: VscodeCopilotHookInput): string {
  return deriveContentSessionId({
    sessionId: input.sessionId,
    workspace: input.workspaceFolder ?? input.cwd,
    project: input.project
  });
}

function projectFromHook(input: VscodeCopilotHookInput): string | undefined {
  return optionalString(input.project) ?? optionalString(input.workspaceFolder) ?? optionalString(input.cwd);
}

function formatAdditionalContext(context: unknown): string {
  if (typeof context === "string") {
    return truncateText(context, 8000);
  }
  return truncateText(context, 8000);
}

function sanitizeHookPayload(value: unknown): JsonObject | string | boolean | null {
  if (value === undefined) {
    return null;
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  const text = truncateText(value, 12000);
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as JsonObject : text;
  } catch {
    return text;
  }
}

function normalizeEventName(name: string): HookEvent | undefined {
  const lower = name.toLowerCase();
  if (lower === "sessionstart" || lower === "session-start") return "SessionStart";
  if (lower === "pretooluse" || lower === "pre-tool-use") return "PreToolUse";
  if (lower === "posttooluse" || lower === "post-tool-use") return "PostToolUse";
  if (lower === "precompact" || lower === "pre-compact") return "PreCompact";
  return undefined;
}

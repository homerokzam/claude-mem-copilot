import { ClaudeMemClient } from "../claudeMemClient.js";
import { deriveContentSessionId, writeSessionState } from "../sessionState.js";
import type { JsonObject, ToolResult } from "../types.js";
import { asRecord, errorResult, optionalString, textResult } from "../util.js";

const platformSource = "vscode-copilot";

export async function callClaudeMemTool(name: string, rawArgs: unknown, client = new ClaudeMemClient()): Promise<ToolResult> {
  const args = asRecord(rawArgs) as JsonObject;
  try {
    switch (name) {
      case "cmem_status":
        return textResult({ bridge: { ok: true }, worker: await client.health(), config: client.config });
      case "cmem_projects":
        return textResult(await client.projects());
      case "cmem_search":
        requireString(args.query, "query");
        return textResult(await client.search(args));
      case "cmem_timeline":
        return textResult(await client.timeline(args));
      case "cmem_get_observations":
        requireArray(args.ids, "ids");
        return textResult(await client.getObservations(args));
      case "cmem_recent_context":
        return textResult(await client.recentContext(args));
      case "cmem_start_project_session":
        return textResult(await initSession(args, client));
      case "cmem_remember":
        requireString(args.text, "text");
        return textResult(await remember(args, client, "copilot_memory_note", { text: args.text, tags: args.tags }));
      case "cmem_remember_decision":
        requireString(args.decision, "decision");
        return textResult(await remember(args, client, "copilot_decision", {
          decision: args.decision,
          rationale: args.rationale,
          alternatives: args.alternatives,
          files: args.files
        }));
      case "cmem_remember_change":
        requireString(args.summary, "summary");
        return textResult(await remember(args, client, "copilot_change", {
          summary: args.summary,
          filesModified: args.filesModified,
          commandsRun: args.commandsRun,
          tests: args.tests,
          result: args.result
        }));
      case "cmem_summarize_project_session":
        return textResult(await client.summarizeSession(sessionBody(args, {
          last_assistant_message: args.last_assistant_message
        })));
      case "cmem_complete_project_session":
        return textResult(await client.completeSession(sessionBody(args)));
      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return errorResult(error instanceof Error ? error.message : String(error));
  }
}

async function initSession(args: JsonObject, client: ClaudeMemClient): Promise<unknown> {
  const contentSessionId = getContentSessionId(args);
  await writeSessionState({ lastContentSessionId: contentSessionId });
  return client.initSession(sessionBody(args, {
    prompt: args.prompt,
    customTitle: args.customTitle
  }));
}

async function remember(args: JsonObject, client: ClaudeMemClient, toolName: string, payload: JsonObject): Promise<unknown> {
  const body = sessionBody(args, {
    tool_name: toolName,
    tool_input: {
      project: args.project,
      contentSessionId: getContentSessionId(args),
      ...payload
    },
    tool_response: optionalString(args.text) ?? JSON.stringify(payload),
    is_error: false
  });

  await client.initSession(sessionBody(args, { prompt: `Memory update from ${toolName}` }));
  const response = await client.addObservation(body);
  await writeSessionState({ lastContentSessionId: getContentSessionId(args) });
  return response;
}

export function sessionBody(args: JsonObject, extra: JsonObject = {}): JsonObject {
  const contentSessionId = getContentSessionId(args);
  return {
    contentSessionId,
    claudeSessionId: contentSessionId,
    platformSource,
    project: args.project,
    ...extra
  };
}

function getContentSessionId(args: JsonObject): string {
  return optionalString(args.contentSessionId) ?? deriveContentSessionId({ workspace: args.project });
}

function requireString(value: unknown, name: string): void {
  if (!optionalString(value)) {
    throw new Error(`Missing required string argument: ${name}`);
  }
}

function requireArray(value: unknown, name: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Missing required array argument: ${name}`);
  }
}

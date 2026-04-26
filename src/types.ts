export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

export type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

export type WorkerConfig = {
  host: string;
  port: string;
  baseUrl: string;
  timeoutMs: number;
};

export type VscodeCopilotHookInput = {
  sessionId?: string;
  hookEventName?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_response?: unknown;
  tool_output?: unknown;
  is_error?: boolean;
  source?: string;
  cwd?: string;
  workspaceFolder?: string;
  project?: string;
  prompt?: string;
  reason?: string;
  [key: string]: unknown;
};

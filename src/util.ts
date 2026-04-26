import type { JsonValue, ToolResult } from "./types.js";

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function textResult(value: unknown): ToolResult {
  return { content: [{ type: "text", text: typeof value === "string" ? value : jsonText(value) }] };
}

export function errorResult(message: string, details?: JsonValue): ToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: jsonText({ error: message, details }) }]
  };
}

export function truncateText(value: unknown, maxLength = 12000): string {
  const text = typeof value === "string" ? value : jsonText(value);
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}\n...[truncated]`;
}

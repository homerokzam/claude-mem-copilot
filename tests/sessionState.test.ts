import { describe, expect, it } from "vitest";
import { deriveContentSessionId } from "../src/sessionState.js";

describe("deriveContentSessionId", () => {
  it("uses the Copilot sessionId when provided", () => {
    expect(deriveContentSessionId({ sessionId: "abc123" })).toBe("vscode-copilot:abc123");
  });

  it("falls back to a deterministic workspace/day id", () => {
    const date = new Date("2026-04-26T12:00:00Z");
    const first = deriveContentSessionId({ workspace: "/repo", date });
    const second = deriveContentSessionId({ workspace: "/repo", date });
    expect(first).toBe(second);
    expect(first).toMatch(/^vscode-copilot:[a-f0-9]{12}:2026-04-26$/);
  });
});

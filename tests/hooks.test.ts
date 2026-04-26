import { describe, expect, it, vi } from "vitest";
import { handleVscodeCopilotHook } from "../src/hooks/vscodeCopilot/handlers.js";

vi.mock("../src/claudeMemClient.js", () => ({
  ClaudeMemClient: class {
    async injectedContext() {
      return { memories: ["decision: use TypeScript"] };
    }
    async initSession() {
      return { ok: true };
    }
    async addObservation() {
      return { ok: true };
    }
    async summarizeSession() {
      return { summary: "compact memory" };
    }
  }
}));

describe("VS Code Copilot hooks", () => {
  it("returns additional context for SessionStart", async () => {
    const output = await handleVscodeCopilotHook("sessionstart", { sessionId: "s1", cwd: "/repo" }) as any;
    expect(output.hookSpecificOutput.hookEventName).toBe("SessionStart");
    expect(output.hookSpecificOutput.additionalContext).toContain("TypeScript");
  });

  it("does not capture cmem tools on PostToolUse", async () => {
    await expect(handleVscodeCopilotHook("posttooluse", { tool_name: "cmem_search" })).resolves.toEqual({});
  });
});

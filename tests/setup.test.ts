import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setupVscodeCopilot } from "../src/setup.js";

describe("setupVscodeCopilot", () => {
  it("writes MCP and hook config", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "cmem-copilot-"));
    const result = await setupVscodeCopilot({ workspaceRoot: workspace, writeInstructions: true });
    expect(result.files.length).toBe(3);

    const mcp = await readFile(join(workspace, ".vscode", "mcp.json"), "utf8");
    expect(mcp).toContain("claude-mem-copilot");

    const hooks = await readFile(join(workspace, ".github", "hooks", "claude-mem-copilot.json"), "utf8");
    expect(hooks).toContain("SessionStart");
    expect(hooks).toContain("posttooluse");
  });
});

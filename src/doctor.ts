import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse, type ParseError } from "jsonc-parser";
import { ClaudeMemClient } from "./claudeMemClient.js";

export type DoctorCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

export async function runDoctor(workspaceRoot = process.cwd()): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  checks.push(checkNodeVersion());
  checks.push(await checkWorker());
  checks.push(await checkJsoncFile(join(workspaceRoot, ".vscode", "mcp.json"), "VS Code MCP config"));
  checks.push(await checkFile(join(workspaceRoot, ".github", "hooks", "claude-mem-copilot.json"), "VS Code Copilot hook config"));
  checks.push({
    name: "Copilot hooks API",
    ok: true,
    detail: "VS Code Copilot hooks are preview; rerun doctor after Copilot or VS Code updates."
  });
  return checks;
}

function checkNodeVersion(): DoctorCheck {
  const major = Number(process.versions.node.split(".")[0]);
  return {
    name: "Node.js >= 20",
    ok: major >= 20,
    detail: process.version
  };
}

async function checkWorker(): Promise<DoctorCheck> {
  const client = new ClaudeMemClient();
  try {
    await client.health();
    return { name: "Claude-Mem worker", ok: true, detail: client.config.baseUrl };
  } catch (error) {
    return {
      name: "Claude-Mem worker",
      ok: false,
      detail: `${client.config.baseUrl} - ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function checkFile(path: string, name: string): Promise<DoctorCheck> {
  try {
    await access(path);
    return { name, ok: true, detail: path };
  } catch {
    return { name, ok: false, detail: `${path} not found` };
  }
}

async function checkJsoncFile(path: string, name: string): Promise<DoctorCheck> {
  try {
    const text = await readFile(path, "utf8");
    const errors: ParseError[] = [];
    parse(text, errors, { allowTrailingComma: true, disallowComments: false });
    return { name, ok: errors.length === 0, detail: errors.length === 0 ? path : `${path} has JSONC syntax errors` };
  } catch {
    return { name, ok: false, detail: `${path} not found` };
  }
}

export function formatDoctorChecks(checks: DoctorCheck[]): string {
  return checks.map((check) => `${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`).join("\n");
}

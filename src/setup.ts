import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { applyEdits, format, modify, parse, parseTree, type ParseError } from "jsonc-parser";

export type SetupOptions = {
  workspaceRoot: string;
  writeInstructions?: boolean;
  useNpx?: boolean;
};

const serverName = "claude-mem-copilot";

export async function setupVscodeCopilot(options: SetupOptions): Promise<{ files: string[]; notes: string[] }> {
  const files: string[] = [];
  const notes: string[] = [];

  files.push(await upsertMcpConfig(options.workspaceRoot, options.useNpx ?? true));
  files.push(await writeHooksConfig(options.workspaceRoot, options.useNpx ?? true));

  if (options.writeInstructions) {
    files.push(await writeCopilotInstructions(options.workspaceRoot));
  } else {
    notes.push("Skipped .github/copilot-instructions.md. Re-run with --write-instructions to add it.");
  }

  return { files, notes };
}

async function upsertMcpConfig(workspaceRoot: string, useNpx: boolean): Promise<string> {
  const filePath = join(workspaceRoot, ".vscode", "mcp.json");
  await mkdir(dirname(filePath), { recursive: true });

  const serverConfig = useNpx
    ? { command: "npx", args: ["-y", "claude-mem-copilot"], type: "stdio" }
    : { command: "claude-mem-copilot", type: "stdio" };

  let text = "{\n  \"servers\": {}\n}\n";
  try {
    text = await readFile(filePath, "utf8");
  } catch {
    // Create below.
  }

  const errors: ParseError[] = [];
  parse(text, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length > 0) {
    throw new Error(`Could not parse ${filePath} as JSONC. Fix syntax before running setup.`);
  }

  let updated = text;
  const root = parseTree(updated, [], { allowTrailingComma: true, disallowComments: false });
  if (!root) {
    updated = "{\n  \"servers\": {}\n}\n";
  }

  updated = applyEdits(updated, modify(updated, ["servers", serverName], serverConfig, {
    formattingOptions: { insertSpaces: true, tabSize: 2 }
  }));
  updated = applyEdits(updated, format(updated, undefined, { insertSpaces: true, tabSize: 2 }));
  await writeFile(filePath, updated.endsWith("\n") ? updated : `${updated}\n`, "utf8");
  return filePath;
}

async function writeHooksConfig(workspaceRoot: string, useNpx: boolean): Promise<string> {
  const filePath = join(workspaceRoot, ".github", "hooks", "claude-mem-copilot.json");
  await mkdir(dirname(filePath), { recursive: true });
  const command = (event: string) => useNpx
    ? `npx -y claude-mem-copilot hook vscode-copilot ${event}`
    : `claude-mem-copilot hook vscode-copilot ${event}`;

  const config = {
    hooks: {
      SessionStart: [{ type: "command", command: command("sessionstart") }],
      PreToolUse: [{ type: "command", command: command("pretooluse") }],
      PostToolUse: [{ type: "command", command: command("posttooluse") }],
      PreCompact: [{ type: "command", command: command("precompact") }]
    }
  };
  await writeFile(filePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return filePath;
}

async function writeCopilotInstructions(workspaceRoot: string): Promise<string> {
  const filePath = join(workspaceRoot, ".github", "copilot-instructions.md");
  await mkdir(dirname(filePath), { recursive: true });
  const content = `# Claude-Mem Project Memory\n\nUse Claude-Mem memory when the task depends on previous project context, decisions, bugs, commands, or user preferences. Prefer \`cmem_search\` first, then \`cmem_timeline\` or \`cmem_get_observations\` when a result needs more context.\n\nAt the end of meaningful work, record durable project outcomes with \`cmem_remember_change\` or \`cmem_remember_decision\`. Do not store secrets, credentials, tokens, or private personal data.\n`;
  await writeFile(filePath, content, "utf8");
  return filePath;
}

#!/usr/bin/env node
import { runDoctor, formatDoctorChecks } from "./doctor.js";
import { runVscodeCopilotHook } from "./hooks/vscodeCopilot/runHook.js";
import { runMcpServer } from "./mcpServer.js";
import { setupVscodeCopilot } from "./setup.js";
import { packageName, packageVersion } from "./version.js";

async function main(argv: string[]): Promise<void> {
  const [command, ...rest] = argv;

  if (!command || command === "serve") {
    await runMcpServer();
    return;
  }

  if (command === "hook") {
    const [adapter, eventName] = rest;
    if (adapter !== "vscode-copilot" || !eventName) {
      throw new Error("Usage: claude-mem-copilot hook vscode-copilot <sessionstart|pretooluse|posttooluse|precompact>");
    }
    await runVscodeCopilotHook(eventName);
    return;
  }

  if (command === "setup") {
    const adapter = optionValue(rest, "--adapter") ?? "vscode-copilot";
    if (adapter !== "vscode-copilot") {
      throw new Error(`Unsupported adapter: ${adapter}`);
    }
    const result = await setupVscodeCopilot({
      workspaceRoot: process.cwd(),
      writeInstructions: rest.includes("--write-instructions"),
      useNpx: !rest.includes("--global-command")
    });
    console.log(`Configured ${packageName}:`);
    for (const file of result.files) {
      console.log(`- ${file}`);
    }
    for (const note of result.notes) {
      console.log(`- ${note}`);
    }
    return;
  }

  if (command === "doctor") {
    const checks = await runDoctor(process.cwd());
    console.log(formatDoctorChecks(checks));
    if (checks.some((check) => !check.ok)) {
      process.exitCode = 1;
    }
    return;
  }

  if (command === "upgrade") {
    console.log("Update with: npm install -g claude-mem-copilot@latest or use npx claude-mem-copilot@latest setup --adapter vscode-copilot");
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log(`${packageName} ${packageVersion}`);
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

function optionValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function printHelp(): void {
  console.log(`claude-mem-copilot ${packageVersion}\n\nUsage:\n  claude-mem-copilot                  Start MCP stdio server\n  claude-mem-copilot serve            Start MCP stdio server\n  claude-mem-copilot setup --adapter vscode-copilot [--write-instructions]\n  claude-mem-copilot doctor\n  claude-mem-copilot hook vscode-copilot <sessionstart|pretooluse|posttooluse|precompact>\n  claude-mem-copilot version\n`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

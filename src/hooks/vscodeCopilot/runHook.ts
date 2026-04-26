import { stdin } from "node:process";
import { handleVscodeCopilotHook } from "./handlers.js";
import type { VscodeCopilotHookInput } from "../../types.js";

export async function runVscodeCopilotHook(eventName: string): Promise<void> {
  const inputText = await readStdin();
  const input = parseHookInput(inputText);
  const output = await handleVscodeCopilotHook(eventName, input);
  if (output && Object.keys(output as Record<string, unknown>).length > 0) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseHookInput(inputText: string): VscodeCopilotHookInput {
  if (!inputText.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(inputText);
    return parsed && typeof parsed === "object" ? parsed as VscodeCopilotHookInput : {};
  } catch {
    return {};
  }
}

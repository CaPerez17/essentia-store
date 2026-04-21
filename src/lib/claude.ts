/**
 * Shared Claude API caller for server-only routes.
 * Requires ANTHROPIC_API_KEY in env. Never imported from client code.
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

interface CallClaudeOpts {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}

/**
 * Calls Claude and returns the assistant text content.
 */
export async function callClaude({
  system,
  user,
  maxTokens = 1200,
  timeoutMs = 30000,
}: CallClaudeOpts): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude API ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const text = json.content
      .filter((b) => b.type === "text" && typeof b.text === "string")
      .map((b) => b.text as string)
      .join("\n")
      .trim();
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strip any markdown code fence from an LLM JSON response.
 */
export function stripJsonFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    const firstNewline = t.indexOf("\n");
    if (firstNewline >= 0) t = t.slice(firstNewline + 1);
    if (t.endsWith("```")) t = t.slice(0, -3).trim();
  }
  return t.trim();
}

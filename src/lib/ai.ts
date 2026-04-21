/**
 * Shared AI helper (OpenAI) for server-only routes.
 * Requires OPENAI_API_KEY in env. Never imported from client code.
 */
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

interface CallAIOpts {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
  /** Request JSON-only response (uses OpenAI's json_object response_format). */
  jsonMode?: boolean;
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return new OpenAI({ apiKey });
}

/**
 * Calls the OpenAI Chat Completions API and returns the assistant text.
 */
export async function callAI({
  system,
  user,
  maxTokens = 1200,
  timeoutMs = 30000,
  jsonMode = false,
}: CallAIOpts): Promise<string> {
  const client = getClient();

  const response = await client.chat.completions.create(
    {
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
    },
    { timeout: timeoutMs },
  );

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error("OpenAI returned empty response");
  }
  return text.trim();
}

/**
 * Strip any markdown code fence from an LLM JSON response.
 * Still useful as a safety net even with json_object response_format.
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

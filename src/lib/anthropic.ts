import Anthropic from "@anthropic-ai/sdk";

// Cliente y helpers compartidos para los chats con Claude.
// Modelo barato y rápido para chatbots (equivalente a gpt-4o-mini).
export const CHAT_MODEL = "claude-haiku-4-5";

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

/** Extrae un objeto JSON de la respuesta del modelo (tolera vallas de markdown). */
export function extractJson(text: string): unknown {
  let t = (text || "").trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s >= 0 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

/**
 * Llama a Claude (Haiku) con un system prompt + historial y devuelve el texto.
 * Para chatbots que devuelven JSON, pasa el texto por extractJson().
 */
export async function claudeChat(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): Promise<string> {
  const res = await anthropic().messages.create({
    model: CHAT_MODEL,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: opts.messages,
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

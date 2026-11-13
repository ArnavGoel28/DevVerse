import "server-only";

import { GoogleGenAI } from "@google/genai";

// Gemini is called only from the server (NFR-SE-04). The key never reaches the browser.
// Feature code calls these helpers, never the SDK directly, so the model can be swapped (NFR-AI-06).

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function ai(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

export type ChatTurn = { role: "user" | "model"; text: string };

/** Asks Gemini for JSON matching `schema`. Returns the raw text, or throws. */
export async function generateJson(prompt: string, schema: unknown): Promise<string> {
  const res = await ai().models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.4 },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

/** Plain-text answer, optionally grounded with Google Search (real, current links — D-16). */
export async function generateText(opts: { system?: string; prompt: string; search?: boolean }): Promise<string> {
  const res = await ai().models.generateContent({
    model: GEMINI_MODEL,
    contents: opts.prompt,
    config: {
      systemInstruction: opts.system,
      temperature: 0.4,
      ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

/** Streams a chat answer chunk by chunk. */
export async function* streamChat(system: string, turns: ChatTurn[]): AsyncGenerator<string> {
  const stream = await ai().models.generateContentStream({
    model: GEMINI_MODEL,
    contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    config: { systemInstruction: system, temperature: 0.5 },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

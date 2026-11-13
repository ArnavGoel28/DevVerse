import "server-only";

import { GoogleGenAI } from "@google/genai";

// Gemini is called only from the server (NFR-SE-04). The key never reaches the browser.

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

let client: GoogleGenAI | null = null;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Asks Gemini for JSON matching `schema`. Returns the raw text, or throws. */
export async function generateJson(prompt: string, schema: unknown): Promise<string> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json", responseJsonSchema: schema, temperature: 0.4 },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

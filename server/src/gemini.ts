import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in environment.");
}

export const ai = new GoogleGenerativeAI(apiKey);

export const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

/**
 * Converts your chat messages into Gemini "contents" format.
 */
export function toGeminiContents(
  messages: Array<{ role: "user" | "assistant"; content: string }>
) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));
}

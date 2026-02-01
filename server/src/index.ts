import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import { ai, modelName, toGeminiContents } from "./gemini.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const allowedOrigins =
  (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);

const PORT = Number(process.env.PORT || 5050);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "gemini-chat", model: modelName });
});

const ChatBodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1)
    })
  ),
  system: z.string().optional(),
  temperature: z.number().min(0).max(2).optional()
});

/**
 * Non-streaming: returns one final response
 */
app.post("/api/chat", async (req, res) => {
  try {
    const body = ChatBodySchema.parse(req.body);

    const contents = toGeminiContents(body.messages);
    const systemInstruction = body.system?.trim()
      ? body.system.trim()
      : "You are a helpful assistant.";

    const model = ai.getGenerativeModel({ model: modelName });
    const response = await model.generateContent({
      contents,
      systemInstruction,
      generationConfig: {
        temperature: body.temperature ?? 0.6
      }
    });

    // Text output
    const text = response.response.text() || "";
    res.json({ ok: true, text });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err?.message || "bad_request" });
  }
});

/**
 * Streaming: Server-Sent Events (SSE)
 * Frontend reads chunks as they arrive.
 *
 * Gemini supports streaming (streamGenerateContent / SDK streaming). :contentReference[oaicite:2]{index=2}
 */
app.post("/api/chat/stream", async (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    const body = ChatBodySchema.parse(req.body);

    const contents = toGeminiContents(body.messages);
    const systemInstruction = body.system?.trim()
      ? body.system.trim()
      : "You are a helpful assistant.";

    // Tell client we started
    res.write(`event: start\ndata: {}\n\n`);

    // Stream from Gemini
    const model = ai.getGenerativeModel({ model: modelName });
    const stream = await model.generateContentStream({
      contents,
      systemInstruction,
      generationConfig: {
        temperature: body.temperature ?? 0.6
      }
    });

    // Use .stream() to get the async iterable
    for await (const chunk of stream.stream) {
      const delta = chunk.text ?? "";
      if (delta) {
        // Send chunk
        res.write(`event: token\ndata: ${JSON.stringify({ token: delta })}\n\n`);
      }
    }

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err: any) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: err?.message || "stream_failed" })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`✅ Gemini chat server running on http://localhost:${PORT}`);
});

import express from "express";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
const ai = new GoogleGenAI({ apiKey });

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/message", async (req, res) => {
  const userText = req.body.text;

  // Server-Sent Events: hold one connection open and stream messages over it.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: userText,
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Explicit completion marker; the client reads its absence as a cut-off stream.
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Gemini stream failed:", err);
    // Headers are already sent, so the error rides the stream, not an HTTP status.
    res.write(
      `data: ${JSON.stringify({
        error: "The assistant failed to respond.",
      })}\n\n`
    );
    res.end();
  }
});

// Bind to the host-assigned port in production; fall back to 3000 locally.
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

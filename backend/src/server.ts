import express from "express"; // 🔵 the framework
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing"); // 🔵 guard: fail loud if the key didn't load
const ai = new GoogleGenAI({ apiKey });

const app = express(); // 🔵 create the app
app.use(express.json()); // ⚪ lets the server read JSON request bodies

// 🔵 one route — a health check so we can prove the server is alive
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/message", async (req, res) => {
  const userText = req.body.text; // 🔵 read the user's message from the request body

  // ⚪ SSE headers — tell the browser "this is a stream, keep the line open"
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 🔵 call Gemini in streaming mode — this returns token chunks, not one big reply
    const stream = await ai.models.generateContentStream({
      model: "gemini-flash-latest",
      contents: userText,
    });

    // 🔵 THE streaming loop: each chunk is a token delta; push it to the browser as an SSE message
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`); // 🔵 signal the stream is finished
    res.end();
  } catch (err) {
    // ⬅️ NEW
    console.error("Gemini stream failed:", err);
    res.write(
      `data: ${JSON.stringify({
        error: "The assistant failed to respond.",
      })}\n\n`
    );
    res.end();
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

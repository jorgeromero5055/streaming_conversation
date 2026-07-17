import express from "express";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { runTool, toolDeclarations } from "./tools";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing");
const ai = new GoogleGenAI({ apiKey });

const app = express();
app.use(cors({ origin: "https://streaming-conversation-1.onrender.com" }));
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
    const contents: any[] = [{ role: "user", parts: [{ text: userText }] }];

    // 🔵 PATTERN: the agentic loop — ask the model, keep going until it stops asking for tools.
    while (true) {
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.1-flash-lite",
        contents, // 🔵 the WHOLE conversation so far — not just the latest message
        config: { tools: [{ functionDeclarations: toolDeclarations }] }, // ⚪ hand the model its tools
      });

      const calls: any[] = [];
      const modelParts: any[] = []; // 🔵 the model's ACTUAL reply parts — we send these back verbatim
      for await (const chunk of stream) {
        if (chunk.text)
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`); // stream words
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (parts) modelParts.push(...parts); // 🔵 keep the REAL parts (they carry the required signature)
        if (chunk.functionCalls) calls.push(...chunk.functionCalls); // 🔵 gather any tool requests
      }
      // 🔵 the model talked instead of asking for a tool → we have our answer, stop.
      if (calls.length === 0) break;

      // 🔵 send the model's OWN turn back UNCHANGED — don't rebuild it (that dropped the signature).
      contents.push({ role: "model", parts: modelParts });

      // 🔵 run each tool, narrating its lifecycle to the frontend over SSE.
      const responseParts = calls.map((call) => {
        // 🔵 about to run → tracker row goes "running"
        res.write(
          `data: ${JSON.stringify({ tool: call.name, status: "running" })}\n\n`
        );
        const output = runTool(call.name, call.args);
        // 🔵 finished → tracker row goes "done"
        res.write(
          `data: ${JSON.stringify({ tool: call.name, status: "done" })}\n\n`
        );
        return { functionResponse: { name: call.name, response: { output } } };
      });

      contents.push({ role: "user", parts: responseParts });
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

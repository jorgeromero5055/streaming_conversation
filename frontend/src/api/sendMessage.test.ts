import { describe, it, expect, vi, afterEach } from "vitest";
import { sendMessage } from "./sendMessage";
import type { ConversationState } from "../types";

// Builds a fake fetch response whose body streams the given SSE strings as bytes.
function streamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return { ok: true, body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("sendMessage", () => {
  it("accumulates deltas into the reply and ends streaming on done", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          streamingResponse([
            `data: ${JSON.stringify({ text: "Hello" })}\n\n`,
            `data: ${JSON.stringify({ text: " there" })}\n\n`,
            `data: ${JSON.stringify({ done: true })}\n\n`,
          ])
        )
    );

    const snapshots: ConversationState[] = [];
    sendMessage("hi", (s) => snapshots.push(s));

    await vi.waitFor(() => expect(snapshots.at(-1)?.isStreaming).toBe(false));

    const final = snapshots.at(-1)!;
    expect(final.text).toBe("Hello there");
    expect(final.error).toBeNull();
  });

  it("surfaces a backend error through the error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([
          `data: ${JSON.stringify({
            tool: "getWeather",
            status: "running",
          })}\n\n`,
          `data: ${JSON.stringify({
            error: "The assistant failed to respond.",
          })}\n\n`,
        ])
      )
    );

    const snapshots: ConversationState[] = [];
    sendMessage("hi", (s) => snapshots.push(s));

    await vi.waitFor(() => expect(snapshots.at(-1)?.isStreaming).toBe(false));

    const final = snapshots.at(-1)!;
    expect(final.error).toBe("The assistant failed to respond.");
    expect(final.steps).toEqual([]); // 🔵 the in-progress row was cleared, not left spinning
  });

  it("shows a cutoff error if the stream ends without a done signal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([
          `data: ${JSON.stringify({ text: "Half a rep" })}\n\n`,
          // no done message — the omission is the test
        ])
      )
    );

    const snapshots: ConversationState[] = [];
    sendMessage("hi", (s) => snapshots.push(s));

    await vi.waitFor(() => expect(snapshots.at(-1)?.isStreaming).toBe(false));

    const final = snapshots.at(-1)!;
    expect(final.error).toBe("The response was cut off. Please try again.");
    expect(final.text).toBe("Half a rep"); // partial text preserved
  });

  it("maps tool events into tracker steps, running then done", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse([
          `data: ${JSON.stringify({
            tool: "getWeather",
            status: "running",
          })}\n\n`,
          `data: ${JSON.stringify({
            tool: "getWeather",
            status: "done",
          })}\n\n`,
          `data: ${JSON.stringify({ text: "It's sunny." })}\n\n`,
          `data: ${JSON.stringify({ done: true })}\n\n`,
        ])
      )
    );

    const snapshots: ConversationState[] = [];
    sendMessage("weather?", (s) => snapshots.push(s));

    await vi.waitFor(() => expect(snapshots.at(-1)?.isStreaming).toBe(false));

    // 🔵 the running event created a row that some snapshot showed mid-flight...
    const sawRunning = snapshots.some((s) =>
      s.steps.some(
        (step) => step.id === "getWeather" && step.status === "running"
      )
    );
    expect(sawRunning).toBe(true);

    // 🔵 ...and the done event flipped that same row to done by the end.
    expect(snapshots.at(-1)!.steps).toEqual([
      { id: "getWeather", label: "getWeather", status: "done" },
    ]);
  });
});

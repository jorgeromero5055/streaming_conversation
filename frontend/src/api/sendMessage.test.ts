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
});

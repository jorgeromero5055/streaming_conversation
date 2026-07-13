import { describe, it, expect, vi, afterEach } from "vitest";
import { sendMessage } from "./sendMessage";
import type { ConversationState } from "../types";

// ⚪ BOILERPLATE — builds a fake fetch response whose body streams the given SSE strings as bytes.
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

afterEach(() => vi.unstubAllGlobals()); // ⚪ undo the fetch mock after each test

describe("sendMessage", () => {
  it("accumulates deltas into the reply and ends streaming on done", async () => {
    // 🔵 mock fetch to return our fake stream — no real network
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

    // 🔵 collect every snapshot sendMessage emits
    const snapshots: ConversationState[] = [];
    sendMessage("hi", (s) => snapshots.push(s));

    // 🔵 the async streaming runs in the background — wait until it finishes
    await vi.waitFor(() => {
      expect(snapshots.at(-1)?.isStreaming).toBe(false);
    });

    // 🔵 THE assertion: deltas accumulated correctly, clean finish
    const final = snapshots.at(-1)!;
    expect(final.text).toBe("Hello there");
    expect(final.error).toBeNull();
  });
});

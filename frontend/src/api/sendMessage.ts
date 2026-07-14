import type { ConversationState, StepStatus } from "../types";

// The single seam between the UI and the backend: streams conversation snapshots
// to `onUpdate` and returns a cancel function. Components render whatever comes
// out and never know the reply arrives over a network stream.
export function sendMessage(
  userText: string,
  onUpdate: (state: ConversationState) => void
): () => void {
  const controller = new AbortController();

  let text = "";
  const steps = [
    {
      id: "s1",
      label: "Understanding your request",
      status: "running" as StepStatus,
    },
    {
      id: "s2",
      label: "Composing a response",
      status: "pending" as StepStatus,
    },
  ];

  // Emit a fresh copy each time so React never receives a snapshot we later mutate.
  const emit = (isStreaming: boolean, error: string | null = null) => {
    onUpdate({ text, isStreaming, steps: steps.map((s) => ({ ...s })), error });
  };

  emit(true);

  (async () => {
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
        signal: controller.signal,
      });

      if (!res.ok) {
        emit(false, "Something went wrong. Please try again.");
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;
      let sawDone = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // A network chunk may hold partial or multiple SSE messages; split on the
        // blank-line delimiter and keep any incomplete tail for the next read.
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const message of messages) {
          const line = message.trim();
          if (!line.startsWith("data:")) continue;

          const payload = JSON.parse(line.slice(5).trim());

          if (payload.error) {
            emit(false, payload.error);
            return;
          }
          if (payload.done) sawDone = true;

          if (payload.text) {
            if (firstToken) {
              steps[0].status = "done";
              steps[1].status = "running";
              firstToken = false;
            }
            text += payload.text;
            emit(true);
          }
        }
      }

      // Stream closed without a completion marker → it was cut off.
      if (!sawDone) {
        emit(false, "The response was cut off. Please try again.");
        return;
      }

      steps[0].status = "done";
      steps[1].status = "done";
      emit(false);
    } catch {
      // Ignore deliberate cancellations; surface only real failures.
      if (!controller.signal.aborted) {
        emit(false, "Something went wrong. Please try again.");
      }
    }
  })();

  return () => controller.abort();
}

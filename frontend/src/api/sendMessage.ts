import type { ConversationState, ActionStepData } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

// The single seam between the UI and the backend: streams conversation snapshots
// to `onUpdate` and returns a cancel function. Components render whatever comes
// out and never know the reply arrives over a network stream.
export function sendMessage(
  userText: string,
  onUpdate: (state: ConversationState) => void
): () => void {
  const controller = new AbortController();

  let text = "";
  const steps: ActionStepData[] = []; // 🔵 rows are built from real tool events now, not hardcoded

  // Emit a fresh copy each time so React never receives a snapshot we later mutate.
  const emit = (isStreaming: boolean, error: string | null = null) => {
    onUpdate({ text, isStreaming, steps: steps.map((s) => ({ ...s })), error });
  };

  emit(true);

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/message`, {
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
            steps.length = 0;
            emit(false, payload.error);
            return;
          }
          if (payload.done) sawDone = true;

          // 🔵 tool lifecycle → dynamic tracker rows. THIS is the seam turning real.
          if (payload.tool) {
            if (payload.status === "running") {
              steps.push({
                id: payload.tool,
                label: payload.tool,
                status: "running",
              });
            } else if (payload.status === "done") {
              const step = steps.find((s) => s.id === payload.tool);
              if (step) step.status = "done";
            }
            emit(true);
          }

          if (payload.text) {
            text += payload.text;
            emit(true);
          }
        }
      }

      // Stream closed without a completion marker → it was cut off.
      if (!sawDone) {
        steps.length = 0;
        emit(false, "The response was cut off. Please try again.");
        return;
      }

      emit(false);
    } catch {
      // Ignore deliberate cancellations; surface only real failures.
      steps.length = 0;
      if (!controller.signal.aborted) {
        emit(false, "Something went wrong. Please try again.");
      }
    }
  })();

  return () => controller.abort();
}

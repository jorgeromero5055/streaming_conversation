import type { ConversationState, StepStatus } from "../types";

export function sendMessage(
  userText: string,
  onUpdate: (state: ConversationState) => void
): () => void {
  const controller = new AbortController(); // ⬅️ NEW

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

  const emit = (isStreaming: boolean, error: string | null = null) => {
    onUpdate({ text, isStreaming, steps: steps.map((s) => ({ ...s })), error });
  };

  emit(true);

  (async () => {
    try {
      // ⬅️ NEW
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
        signal: controller.signal, // ⬅️ NEW
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstToken = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split("\n\n");
        buffer = messages.pop() ?? "";

        for (const message of messages) {
          const line = message.trim();
          if (!line.startsWith("data:")) continue;

          const payload = JSON.parse(line.slice(5).trim());
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

      steps[0].status = "done";
      steps[1].status = "done";
      emit(false);
    } catch {
      // ⬅️ NEW
      if (!controller.signal.aborted) {
        emit(false, "Something went wrong. Please try again.");
      }
    }
  })();

  return () => controller.abort(); // ⬅️ CHANGED (was () => {})
}

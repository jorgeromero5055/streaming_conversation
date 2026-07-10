// src/components/ConsolePanel.tsx
import { useState, useEffect } from "react";
import type { ConversationState } from "../types";
import { sendMessage } from "../api/sendMessage";

// ⚪ BOILERPLATE
//    Understand: "a blank starting snapshot — the screen before anything happens."
//    Level: know its job. Don't memorize the fields.
const EMPTY: ConversationState = {
  text: "",
  isStreaming: false,
  steps: [],
  error: null,
};

export function ConsolePanel() {
  // 🔵 PATTERN — the heart of this step.
  //    Understand: `snapshot` holds the current data; `setSnapshot` changes it,
  //    and changing it repaints the screen. You'll write useState in every component.
  //    Level: explain it + rebuild it from scratch.
  const [snapshot, setSnapshot] = useState<ConversationState>(EMPTY);

  // 🔵 PATTERN — "run some code when the component appears."
  //    Understand: on mount, start sendMessage and give it setSnapshot as the
  //    callback (so every snapshot flows into state). Return the cancel function
  //    so React stops the timer when the component goes away (cleanup).
  //    Level: explain it + rebuild it.
  useEffect(() => {
    const cancel = sendMessage("hello", setSnapshot);
    return cancel;
  }, []); // ⚪ the [] just means "run once." Know that; move on.

  // ⚪ TEMPORARY DISPLAY — just to SEE state working. We move this into the real
  //    components next step. Level: don't invest here, it's scaffolding.
  return (
    <div>
      <h1>ConsolePanel</h1>
      <p>{snapshot.text}</p>
      <p>{snapshot.isStreaming ? "typing…" : "idle"}</p>
      {snapshot.steps.map((s) => (
        <div key={s.id}>
          {s.label}: {s.status}
        </div>
      ))}
    </div>
  );
}

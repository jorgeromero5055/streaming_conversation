// src/components/ConsolePanel.tsx
import { useState } from "react";
import type { ConversationState } from "../types";
import { sendMessage } from "../api/sendMessage";
import { StreamingMessage } from "./StreamingMessage";
import { ActionTracker } from "./ActionTracker";
import { Composer } from "./Composer";

const EMPTY: ConversationState = {
  text: "",
  isStreaming: false,
  steps: [],
  error: null,
};

export function ConsolePanel() {
  const [snapshot, setSnapshot] = useState<ConversationState>(EMPTY);

  // 🔵 the parent's handler. When Composer calls onSend, THIS runs — it starts
  //    the stream with the user's text. Level: own this (child→parent in action).
  const handleSend = (text: string) => {
    sendMessage(text, setSnapshot);
  };

  return (
    <div>
      <h1>ConsolePanel</h1>
      <StreamingMessage
        text={snapshot.text}
        isStreaming={snapshot.isStreaming}
      />
      <ActionTracker steps={snapshot.steps} />
      <Composer onSend={handleSend} />
    </div>
  );
}

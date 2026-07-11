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

  const handleSend = (text: string) => {
    sendMessage(text, setSnapshot);
  };

  return (
    <div className="console">
      <h1>Agent Console</h1>
      {snapshot.error && (
        <p className="error" role="alert">
          {snapshot.error}
        </p>
      )}
      <StreamingMessage text={snapshot.text} isStreaming={snapshot.isStreaming} />
      <ActionTracker steps={snapshot.steps} />
      <Composer onSend={handleSend} />
    </div>
  );
}

import { StreamingMessage } from "./StreamingMessage";
import { ActionTracker } from "./ActionTracker";
import { Composer } from "./Composer";

// The one screen. Arranges the reply, the live tracker, and the input.
export function ConsolePanel() {
  return (
    <div>
      <h1>ConsolePanel</h1>
      <StreamingMessage />
      <ActionTracker />
      <Composer />
    </div>
  );
}

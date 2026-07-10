// src/api/sendMessage.ts
import type { ConversationState, StepStatus } from "./types";

// ⚪ BOILERPLATE — the fake reply text.
//    Understand: "the canned answer the mock types out." Level: know its job.
const REPLY = "Sure — here is your response, streaming in one word at a time.";

// ⚪ BOILERPLATE — the shape of one line in the fake script.
//    Understand: "describes one moment: how much text + each step's status."
//    Level: know its job. Deleted in v2.
type Frame = {
  words: number;
  s1: StepStatus;
  s2: StepStatus;
  streaming: boolean;
};

// ⚪ BOILERPLATE — the whole fake timeline, moment by moment.
//    Understand: "the list of snapshots to play, in order." Level: know its job.
const SCRIPT: Frame[] = [
  { words: 0, s1: "pending", s2: "pending", streaming: true },
  { words: 3, s1: "running", s2: "pending", streaming: true },
  { words: 6, s1: "done", s2: "running", streaming: true },
  { words: 10, s1: "done", s2: "running", streaming: true },
  { words: 13, s1: "done", s2: "done", streaming: true },
  { words: 13, s1: "done", s2: "done", streaming: false },
];

// 🔵 PATTERN — THE SEAM's shape. The most important thing in the file.
//    Understand: takes the user's text + a callback (onUpdate), and returns a
//    cancel function. This is the contract components depend on.
//    Level: explain it + rebuild it. This never changes, even in v2.
export function sendMessage(
  userText: string,
  onUpdate: (state: ConversationState) => void
): () => void {
  if (userText.toLowerCase().includes("error")) {
    onUpdate({
      text: "",
      isStreaming: false,
      steps: [],
      error: "Something went wrong. Please try again.",
    });
    return () => {}; // nothing to cancel
  }

  const words = REPLY.split(" ");

  // 🔵 PATTERN — handing a snapshot back to the caller.
  //    Understand: this is HOW the seam talks to the screen — it calls onUpdate
  //    with a full ConversationState. Same idea in every project.
  //    Level: explain it + rebuild it.
  const emit = (f: Frame) => {
    onUpdate({
      text: words.slice(0, f.words).join(" "),
      isStreaming: f.streaming,
      steps: [
        { id: "s1", label: "Understanding your request", status: f.s1 },
        { id: "s2", label: "Composing a response", status: f.s2 },
      ],
      error: null,
    });
  };

  // ⚪ BOILERPLATE — the timer that plays the script.
  //    Understand: "show the first frame now, then the next one every 450ms,
  //    then stop." Level: know its job. Don't memorize setInterval mechanics.
  let tick = 0;
  emit(SCRIPT[tick]);
  const timer = setInterval(() => {
    tick++;
    if (tick >= SCRIPT.length) {
      clearInterval(timer);
      return;
    }
    emit(SCRIPT[tick]);
  }, 450);

  // 🔵 PATTERN (lightly) — returning a way to stop.
  //    Understand: "give the caller a way to cancel the stream." The idea (hand
  //    back a cleanup function) is common; the clearInterval detail is not.
  //    Level: understand the idea; skim the implementation.
  return () => clearInterval(timer);
}

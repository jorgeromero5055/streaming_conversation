import type { ConversationState, StepStatus } from "../types";

// Mock reply the fake stream types out in v1; replaced by a real LLM in v2.
const REPLY = "Sure — here is your response, streaming in one word at a time.";

// One frame of the mock timeline: how much text to reveal + each step's status.
type Frame = { words: number; s1: StepStatus; s2: StepStatus; streaming: boolean };

// The scripted timeline the mock plays, one frame per tick.
const SCRIPT: Frame[] = [
  { words: 0, s1: "pending", s2: "pending", streaming: true },
  { words: 3, s1: "running", s2: "pending", streaming: true },
  { words: 6, s1: "done", s2: "running", streaming: true },
  { words: 10, s1: "done", s2: "running", streaming: true },
  { words: 13, s1: "done", s2: "done", streaming: true },
  { words: 13, s1: "done", s2: "done", streaming: false },
];

// The seam: streams conversation snapshots to `onUpdate` and returns a cancel
// function. v1 plays a mock timeline; v2 swaps the internals for a real LLM
// without changing this signature or the snapshot shape.
export function sendMessage(
  userText: string,
  onUpdate: (state: ConversationState) => void,
): () => void {
  if (userText.toLowerCase().includes("error")) {
    onUpdate({ text: "", isStreaming: false, steps: [], error: "Something went wrong. Please try again." });
    return () => {}; // nothing to cancel
  }

  const words = REPLY.split(" ");

  // Build a full snapshot from a frame and hand it to the caller.
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

  // Play the first frame now, then one every 450ms until the script ends.
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

  // Cancel handle: stop the stream (the caller uses this for cleanup).
  return () => clearInterval(timer);
}

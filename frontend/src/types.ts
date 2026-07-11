// One action step's status.
export type StepStatus = "pending" | "running" | "done";

// One row in the action tracker.
export interface ActionStepData {
  id: string; // stable key so React can track rows
  label: string; // e.g. "Searching docs"
  status: StepStatus;
}

// The full snapshot of the panel at one instant — everything the UI needs to
// redraw itself. sendMessage() emits a stream of THESE.
export interface ConversationState {
  text: string; // reply so far (grows token by token)
  isStreaming: boolean; // true while typing → drives the typing indicator
  steps: ActionStepData[]; // the tracker rows
  error: string | null; // null = fine; a message = show error state
}

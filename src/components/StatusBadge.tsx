// src/components/StatusBadge.tsx
import type { StepStatus } from "../types";

// 🔵 PATTERN — receiving a prop. Understand: `{ status }` pulls the value the
//    parent passed in; the `: { status: StepStatus }` types it. Level: own this.
export function StatusBadge({ status }: { status: StepStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>; // ⚪ styling later
}

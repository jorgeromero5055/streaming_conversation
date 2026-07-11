import type { StepStatus } from "../types";

export function StatusBadge({ status }: { status: StepStatus }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}

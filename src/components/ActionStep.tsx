// src/components/ActionStep.tsx
import type { ActionStepData } from "../types";
import { StatusBadge } from "./StatusBadge";

// 🔵 same props pattern — receives one step, passes its status down to StatusBadge.
export function ActionStep({ step }: { step: ActionStepData }) {
  return (
    <div className="action-step">
      <span>{step.label}</span>
      <StatusBadge status={step.status} />
    </div>
  );
}

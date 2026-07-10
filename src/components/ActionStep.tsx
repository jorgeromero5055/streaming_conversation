import type { ActionStepData } from "../types";
import { StatusBadge } from "./StatusBadge";

export function ActionStep({ step }: { step: ActionStepData }) {
  return (
    <div className="action-step">
      <span>{step.label}</span>
      <StatusBadge status={step.status} />
    </div>
  );
}

import type { ActionStepData } from "../types";
import { ActionStep } from "./ActionStep";

export function ActionTracker({ steps }: { steps: ActionStepData[] }) {
  return (
    <div className="action-tracker">
      {steps.map((step) => (
        <ActionStep key={step.id} step={step} />
      ))}
    </div>
  );
}

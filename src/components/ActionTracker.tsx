// src/components/ActionTracker.tsx
import type { ActionStepData } from "../types";
import { ActionStep } from "./ActionStep";

// 🔵 PATTERN — rendering a list. Understand: `.map` turns each step into an
//    <ActionStep/>. `key={step.id}` lets React track rows. Level: own the idea
//    (map array → components, always a key). ⚪ don't sweat map syntax.
export function ActionTracker({ steps }: { steps: ActionStepData[] }) {
  return (
    <div className="action-tracker">
      {steps.map((step) => (
        <ActionStep key={step.id} step={step} />
      ))}
    </div>
  );
}

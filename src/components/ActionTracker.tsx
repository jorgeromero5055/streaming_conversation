import { ActionStep } from './ActionStep'

// The live tracker. Renders one ActionStep per step (2-3 for now).
export function ActionTracker() {
  return (
    <div>
      ActionTracker
      <ActionStep />
      <ActionStep />
    </div>
  )
}

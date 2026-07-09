import { StatusBadge } from "./StatusBadge";

// One row in the action tracker: icon + label + status. Reused 2-3 times.
export function ActionStep() {
  return (
    <div>
      ActionStep <StatusBadge />
    </div>
  );
}

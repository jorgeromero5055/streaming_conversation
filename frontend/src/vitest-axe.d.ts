import "vitest";
import type { AxeMatchers } from "vitest-axe/matchers";

// Teach TypeScript about the axe matchers added via expect.extend() in the
// test setup, so `expect(...).toHaveNoViolations()` type-checks.
declare module "vitest" {
  interface Assertion extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}

# Agent Console

A single console-style panel where a user types a request in plain English, an AI agent
streams back a response token-by-token, and a live action-tracker shows steps updating in
real time (pending → running → done).

Built as a scoped practice project focused on the skills an AI-native, agentic/chat-driven
UI actually needs: streaming state, a live status tracker, accessible-by-default components,
and an architecture that swaps a mock for a real backend without touching the UI.

![Agent Console](docs/screenshot.png)

## The core idea: one seam

**All backend behavior lives behind a single function — `sendMessage()` — that streams
updates back to the UI. Components render whatever comes out and never know whether it's
real or mocked.**

```
Composer ──▶ sendMessage(text, onUpdate) ──▶ onUpdate(snapshot) ──▶ React state ──▶ UI repaints
                     │
                     └─ v1: fake tokens on a timer
                        v2: a real streaming LLM endpoint  (only the INSIDE changes)
```

- **v1 (this repo):** `sendMessage()` emits fake tokens on a timer and flips the action
  steps through their states.
- **v2:** only the *inside* of `sendMessage()` is rewritten to call a real streaming LLM.
  Because the data shape it emits is unchanged, **no component changes.**

This boundary is deliberate. Mock logic is never scattered inside components — that seam is
the whole point of the design.

## The data contract

`sendMessage()` emits **snapshots** — each update is the *complete* current state of the
panel, not an incremental delta. This keeps components dumb: they render the latest snapshot
and never accumulate state themselves. (In v2, the real token deltas from the network get
stitched into snapshots *inside* the seam, so the contract stays identical.)

```ts
type StepStatus = 'pending' | 'running' | 'done'

interface ActionStepData {
  id: string
  label: string
  status: StepStatus
}

interface ConversationState {
  text: string             // reply so far
  isStreaming: boolean     // drives the typing indicator
  steps: ActionStepData[]  // the tracker rows
  error: string | null     // null = fine; a message = show the error state
}
```

All four UI states fall out of this one shape:

| State   | Condition                           |
| ------- | ----------------------------------- |
| Empty   | `text === '' && steps.length === 0` |
| Loading | `isStreaming === true`              |
| Happy   | `text` has content                  |
| Error   | `error !== null`                    |

## Components

Four reusable components, each self-contained, composed under a single panel:

```
ConsolePanel            holds state, calls the seam, arranges the layout
├── StreamingMessage    renders the reply + typing cursor
├── ActionTracker       maps steps → rows
│   └── ActionStep      one row: label + status
│       └── StatusBadge the pending/running/done pill (reused)
└── Composer            input + send button (Enter or click)
```

## Tech choices

- **Vite + React + TypeScript** — lean SPA tooling; TypeScript makes the data contract
  enforceable (e.g. `StepStatus` rejects a typo'd status at compile time).
- **Vitest + React Testing Library** — tests are written against *behavior a user observes*
  (type, click, Enter), not internals, so they survive refactors.
- **vitest-axe** — accessibility violations are caught automatically in CI.
- **Plain CSS** — components are styled from scratch (no UI library) on purpose, using CSS
  variables, flexbox, and a `state → class → color` pattern for the status pills.

## Testing

Tests target where the *logic* lives, not every line. `Composer` has real behavior (guards,
Enter/click paths, clearing) so it gets the most coverage, including the edge case (empty
input sends nothing). Presentational components get a single render check. Accessibility is
tested with axe as a baseline — with the understanding that automated tools are a floor, not
a ceiling, so the keyboard flow is also verified by hand.

## Accessibility

- Fully keyboard-operable: Tab to focus, Enter/Space to send, visible `:focus-visible` rings.
- The input has a real accessible name (`aria-label`), not just a placeholder.
- `role="alert"` announces errors to screen readers.
- axe runs in CI on every push.

## Scope

**v1 (done):** type a request (Enter + button) · token-by-token streaming with a typing
state · live action tracker through pending/running/done · loading/empty/error states · four
reused components · keyboard + axe · component tests green · CI on push · this README.

**Out of scope for v1 (deliberately):** real LLM backend, multiple agents, a second screen,
auth, persistence, multi-turn memory, theming/animations, deploy.

**v2 — to be scoped.** The next milestone will begin by swapping the mock inside
`sendMessage()` for a real streaming LLM; the seam is built so that's an internal change, not
a rewrite. Full v2 scope will be defined once v1 is sealed. _(placeholder)_

## Running locally

Requires Node 22 (see `.nvmrc`).

```bash
nvm use          # or: nvm install 22
npm install
npm run dev      # start the dev server
npm test         # run the test suite
```

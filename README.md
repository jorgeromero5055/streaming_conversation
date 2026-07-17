# Agent Console

A single console-style panel where a user types a request in plain English, an AI agent
streams back a response token-by-token, and a live action-tracker shows steps updating in
real time (pending → running → done).

Built as a scoped practice project focused on the skills an AI-native, agentic/chat-driven
UI actually needs: streaming state, a live status tracker, accessible-by-default components,
and an architecture that swaps a mock for a real backend without touching the UI.

**🔗 Live demo:** https://streaming-conversation-1.onrender.com
_(First load may take ~50s while the free backend wakes from idle.)_

![Agent Console](docs/screenshot.png)

## The core idea: one seam

**All backend behavior lives behind a single function — `sendMessage()` — that streams
updates back to the UI. Components render whatever comes out and never know whether it's
real or mocked.**

```
Composer ──▶ sendMessage(text, onUpdate) ──▶ onUpdate(snapshot) ──▶ React state ──▶ UI repaints
                     │
                     └─ v1: fake tokens on a timer
                        v2: a real streaming LLM endpoint
                        v3: a real agentic tool-calling loop  (only the INSIDE changes)
```

- **v1:** `sendMessage()` emitted fake tokens on a timer and flipped the action steps
  through their states.
- **v2:** only the *inside* of `sendMessage()` was rewritten to call a real
  streaming LLM (Google Gemini) behind a key-holding backend proxy. The data shape it emits
  is unchanged, so **not a single component changed** — the seam held.
- **v3 (current):** the *inside* of `sendMessage()` now folds real **tool-call events** into
  `steps`. The backend runs an agentic loop — the model calls real tools, each result feeds
  back until it answers — streaming every tool's lifecycle. The tracker went from *cosmetic*
  (v2) to *real*, again with **zero component changes**.

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

## Backend & deployment decisions

- **Node + TypeScript backend (Express)** — same language as the frontend, so the
  `ConversationState` contract is shared across the network. A "backend-for-frontend" proxy keeps
  the LLM call (and its key) server-side.
- **Server-Sent Events (SSE)** for streaming — a one-way server→client token stream is a clean fit
  for LLM output, and simpler than WebSockets for this.
- **API key server-side only** — a frontend bundle is *public* (env vars are baked in at build time
  and shipped to the browser), so secrets can't live there. The backend holds the key and proxies
  the model.
- **Prod calls the backend directly (CORS); dev uses a Vite proxy** — a static-site CDN proxy
  *buffers* responses, which breaks SSE streaming, so in production the browser calls the backend
  origin directly and the backend allows it via CORS. The backend URL is environment-specific config
  (a `VITE_API_BASE` build-time env var); the Vite dev proxy handles local.
- **Render, two services** — the frontend deploys as a static site, the backend as a persistent Node
  service (static files vs. a running process → different host types). Both auto-deploy on push, with
  CI type-checking both first.

## Testing

Tests target where the *logic* lives, not every line.

- **Components** — `Composer` has real behavior (input guards, Enter/click paths, clearing), so it
  gets the most coverage, including the edge case (empty input sends nothing). Presentational
  components get a single render check.
- **The seam (`sendMessage`)** — the delta→snapshot mapping is unit-tested by *mocking `fetch`* with
  a fake SSE stream (no live network). It asserts token deltas accumulate into the reply, and covers
  the error and cut-off branches. The live model call is deliberately *not* unit-tested — that would
  be testing the network, not our logic.
- **Accessibility** — axe runs as a baseline in CI, with the understanding that automated tools are a
  floor, not a ceiling, so the keyboard flow is also verified by hand.

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

**v2 — make it real (done).** The mock inside `sendMessage()` was replaced with a real
streaming LLM (Google Gemini) behind a key-holding backend proxy, deployed live:

1. Restructured into a monorepo — `frontend/` + `backend/`, each with its own `package.json`.
2. Backend proxy streams tokens from Gemini over Server-Sent Events (SSE).
3. The API key lives only in server env — never in browser-shipped code.
4. Real token deltas fold into the existing `ConversationState` shape — **zero component edits.**
5. Network / LLM failures (including cut-off streams) surface through the existing error state.
6. Deployed on Render (static frontend + Node backend), CI/CD on push. Live link above.
7. Single exchange only — no multi-turn (still a later milestone).
8. The delta → snapshot mapping is covered by tests; the live network call is not.

**v3 — make it agentic (done).** The model now calls real tools, each driving a live
`ActionStep` (pending → running → done) as it happens:

1. Two stubbed, deterministic tools (`getWeather`, `recommendClothing`), declared to the model
   as function declarations — no external keys, so they're testable.
2. Agentic loop: the model requests a tool → a name→function dispatcher runs it → request +
   result append to `contents` → loop until it answers (chains weather → clothing → answer).
3. Each tool's lifecycle streams as a new SSE event — `{ tool, status: 'running' | 'done' }` —
   alongside `{text}` / `{done}` / `{error}`.
4. Inside the seam, those fold into `steps` (running pushes a row, done flips it) — **zero
   component changes** again.
5. Tool failures ride the existing `{error}` path; in-progress rows clear on error.
6. The tool-event → steps mapping is unit-tested; the live model is not.
7. Single exchange only — multi-turn still parked.
8. Deployed via the existing CI/CD on push.

**Later / maybe:** multi-turn conversation history (a model-level change — its own milestone),
multiple agents, off-console surface, design-system extraction.

## Running locally

Requires Node 22 (see `.nvmrc`). The app is a monorepo — frontend and backend run separately.

**Backend** (needs a Google Gemini API key):

```bash
cd backend
npm install
echo "GEMINI_API_KEY=your_key_here" > .env
npm run dev      # http://localhost:3000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173  (proxies /api to the backend)
npm test         # run the test suite
```

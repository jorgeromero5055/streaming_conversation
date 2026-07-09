// 🔒 THE SEAM.
//
// All mocked behavior will live behind this one function. Components call it and
// render whatever comes out — they never know it's mocked.
//
// v1: emit fake tokens on a timer + flip action steps through their states.
// v2: rewrite ONLY the inside of this function to call a real streaming LLM
//     endpoint. Same data shape (see ../types) means zero component changes.
//
// Intentionally empty — we design its shape in the next step.
export {};

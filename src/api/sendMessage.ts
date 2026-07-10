import type { ConversationState, StepStatus } from './types'

// 🔒 THE SEAM.
// v1: emit fake ConversationState snapshots on a timer.
// v2: rewrite ONLY the inside to call a real streaming LLM. The signature and
// the snapshot shape stay identical, so components never change.

const REPLY = 'Sure — here is your response, streaming in one word at a time.'

// A tiny script: at each tick, how many words of REPLY are shown, each step's
// status, and whether we are still streaming.
type Frame = { words: number; s1: StepStatus; s2: StepStatus; streaming: boolean }

const SCRIPT: Frame[] = [
  { words: 0, s1: 'pending', s2: 'pending', streaming: true },
  { words: 3, s1: 'running', s2: 'pending', streaming: true },
  { words: 6, s1: 'done', s2: 'running', streaming: true },
  { words: 10, s1: 'done', s2: 'running', streaming: true },
  { words: 13, s1: 'done', s2: 'done', streaming: true },
  { words: 13, s1: 'done', s2: 'done', streaming: false },
]

export function sendMessage(
  _userText: string, // ignored in v1; sent to the LLM in v2
  onUpdate: (state: ConversationState) => void,
): () => void {
  const words = REPLY.split(' ')

  // Turn one frame into a full snapshot and hand it to the caller.
  const emit = (f: Frame) => {
    onUpdate({
      text: words.slice(0, f.words).join(' '),
      isStreaming: f.streaming,
      steps: [
        { id: 's1', label: 'Understanding your request', status: f.s1 },
        { id: 's2', label: 'Composing a response', status: f.s2 },
      ],
      error: null,
    })
  }

  let tick = 0
  emit(SCRIPT[tick]) // first snapshot immediately

  const timer = setInterval(() => {
    tick++
    if (tick >= SCRIPT.length) {
      clearInterval(timer)
      return
    }
    emit(SCRIPT[tick])
  }, 450)

  // Cancel function: stops the stream. Components use this to clean up.
  return () => clearInterval(timer)
}

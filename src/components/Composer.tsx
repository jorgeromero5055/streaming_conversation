import { useState } from "react";

// 🔵 onSend is a function the parent hands down. Child calls it to talk UP.
export function Composer({ onSend }: { onSend: (text: string) => void }) {
  // 🔵 controlled input — the box's text lives here in state.
  const [text, setText] = useState("");

  // ⚪ plumbing — guard empty, send it up, clear the box. Know its job.
  const submit = () => {
    if (text.trim() === "") return;
    onSend(text);
    setText("");
  };

  return (
    <div className="composer">
      <input
        value={text} // 🔵 state drives the input
        onChange={(e) => setText(e.target.value)} // 🔵 typing updates state
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }} // ⚪ Enter to send
        placeholder="Ask the agent…"
      />
      <button onClick={submit}>Send</button>
    </div>
  );
}

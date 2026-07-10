// src/components/StreamingMessage.tsx
// 🔵 same props pattern — receives text + isStreaming.
export function StreamingMessage({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  return (
    <div className="streaming-message">
      {text}
      {isStreaming && <span className="cursor">▋</span>}{" "}
      {/* ⚪ blinking cursor, styled later */}
    </div>
  );
}

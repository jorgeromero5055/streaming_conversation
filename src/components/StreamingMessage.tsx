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
      {isStreaming && <span className="cursor">▋</span>}
    </div>
  );
}

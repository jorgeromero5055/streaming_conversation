import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamingMessage } from "./StreamingMessage";

describe("StreamingMessage", () => {
  it("shows the reply text", () => {
    // 🔵 simplest test type: give props, check output
    render(<StreamingMessage text="hello there" isStreaming={false} />);
    expect(screen.getByText("hello there")).toBeInTheDocument();
  });
});

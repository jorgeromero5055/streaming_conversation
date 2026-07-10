import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StreamingMessage } from "./StreamingMessage";

describe("StreamingMessage", () => {
  it("shows the reply text", () => {
    render(<StreamingMessage text="hello there" isStreaming={false} />);
    expect(screen.getByText("hello there")).toBeInTheDocument();
  });
});

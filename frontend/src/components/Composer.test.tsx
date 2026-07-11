import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";

describe("Composer", () => {
  it("sends the typed text when the button is clicked", async () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    await userEvent.type(screen.getByRole("textbox"), "hello world");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith("hello world");
  });

  it("sends on Enter", async () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    await userEvent.type(screen.getByRole("textbox"), "hi{Enter}");
    expect(onSend).toHaveBeenCalledWith("hi");
  });

  it("does not send when empty", async () => {
    const onSend = vi.fn();
    render(<Composer onSend={onSend} />);
    await userEvent.click(screen.getByRole("button", { name: /send/i }));
    expect(onSend).not.toHaveBeenCalled();
  });
});

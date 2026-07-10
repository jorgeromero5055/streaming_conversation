// src/components/Composer.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Composer } from "./Composer";

describe("Composer", () => {
  it("sends the typed text when the button is clicked", async () => {
    // 🔵 PATTERN — vi.fn() is a "spy": a fake function that records how it was
    //    called. We pass it as onSend so we can check what Composer did with it.
    const onSend = vi.fn();

    // 🔵 PATTERN — render the component into the fake DOM.
    render(<Composer onSend={onSend} />);

    // 🔵 PATTERN — find elements the way a USER perceives them (by role), then
    //    act like a user: type, then click. This is the heart of RTL.
    await userEvent.type(screen.getByRole("textbox"), "hello world");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    // 🔵 PATTERN — assert the BEHAVIOR: onSend was called with what I typed.
    expect(onSend).toHaveBeenCalledWith("hello world");
  });
});

// Add these two inside the existing describe('Composer') block:

it("sends on Enter", async () => {
  // 🔵 same pattern, keyboard path
  const onSend = vi.fn();
  render(<Composer onSend={onSend} />);
  await userEvent.type(screen.getByRole("textbox"), "hi{Enter}"); // ⚪ {Enter} = press Enter
  expect(onSend).toHaveBeenCalledWith("hi");
});

it("does not send when empty", async () => {
  // 🔵 testing an EDGE case, not just happy path
  const onSend = vi.fn();
  render(<Composer onSend={onSend} />);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));
  expect(onSend).not.toHaveBeenCalled(); // 🔵 asserting something did NOT happen
});

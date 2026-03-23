import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScanButton from "../../components/ReferencePageComponents/ScanButton";

describe("ScanButton", () => {
  it("renders children and calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<ScanButton onClick={handleClick}>Click Me</ScanButton>);

    // Check that the child text is rendered
    const button = screen.getByText("Click Me");
    expect(button).toBeInTheDocument();

    // Simulate a click
    await user.click(button);

    // Assert the click handler was called
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
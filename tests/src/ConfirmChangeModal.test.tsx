import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmChangeModal from "../../src/components/StaffComponents/ConfirmChangeModal";

const defaultProps = {
  open: true,
  handleClose: vi.fn(),
  handleConfirm: vi.fn(),
};

describe("ConfirmChangeModal", () => {
  it("renders the title when open", () => {
    render(<ConfirmChangeModal {...defaultProps} />);
    expect(screen.getByText("Confirm Change")).toBeInTheDocument();
  });

  it("renders the confirmation message", () => {
    render(<ConfirmChangeModal {...defaultProps} />);
    expect(screen.getByText("Do you want to confirm change?")).toBeInTheDocument();
  });

  it("renders Cancel and Confirm buttons", () => {
    render(<ConfirmChangeModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("calls handleClose when Cancel is clicked", () => {
    const handleClose = vi.fn();
    render(<ConfirmChangeModal {...defaultProps} handleClose={handleClose} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledOnce();
  });

  it("calls handleConfirm when Confirm is clicked", () => {
    const handleConfirm = vi.fn();
    render(<ConfirmChangeModal {...defaultProps} handleConfirm={handleConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(handleConfirm).toHaveBeenCalledOnce();
  });

  it("does not render modal content when closed", () => {
    render(<ConfirmChangeModal {...defaultProps} open={false} />);
    expect(screen.queryByText("Confirm Change")).not.toBeInTheDocument();
  });
});

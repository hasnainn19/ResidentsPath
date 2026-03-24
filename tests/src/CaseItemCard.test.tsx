import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CaseItemCard from "../../src/components/StaffComponents/CaseItemCard";
import type { CaseSummary } from "../../src/hooks/useCases";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

const baseCaseItem: CaseSummary = {
  id: "case-1",
  caseName: "Housing Issue",
  referenceNumber: "REF001",
  departmentName: "Homelessness",
  status: "OPEN",
  priority: false,
  flag: false,
  enquiry: "housing",
  description: "Needs urgent housing support",
  createdAt: "2024-01-01T00:00:00Z",
};

const renderCard = (overrides: Partial<CaseSummary> = {}) =>
  render(
    <MemoryRouter>
      <CaseItemCard caseItem={{ ...baseCaseItem, ...overrides }} />
    </MemoryRouter>,
  );

describe("CaseItemCard", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the case name and reference number", () => {
    renderCard();
    expect(screen.getByText(/Housing Issue/)).toBeInTheDocument();
    expect(screen.getByText(/REF001/)).toBeInTheDocument();
  });

  it("renders the department label chip", () => {
    renderCard();
    expect(screen.getByText("Homelessness")).toBeInTheDocument();
  });

  it("renders the status chip with a human-readable label", () => {
    renderCard();
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders the description", () => {
    renderCard();
    expect(
      screen.getByText("Needs urgent housing support"),
    ).toBeInTheDocument();
  });

  it("renders 'No description provided.' when description is null", () => {
    renderCard({ description: null });
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
  });

  it("renders Priority chip when priority is true", () => {
    renderCard({ priority: true });
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("does not render Priority chip when priority is false", () => {
    renderCard({ priority: false });
    expect(screen.queryByText("Priority")).not.toBeInTheDocument();
  });

  it("renders Flagged chip when flag is true", () => {
    renderCard({ flag: true });
    expect(screen.getByText("Flagged")).toBeInTheDocument();
  });

  it("does not render Flagged chip when flag is false", () => {
    renderCard({ flag: false });
    expect(screen.queryByText("Flagged")).not.toBeInTheDocument();
  });

  it("renders IN_PROGRESS status as 'In Progress'", () => {
    renderCard({ status: "IN_PROGRESS" });
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders RESOLVED status as 'Resolved'", () => {
    renderCard({ status: "RESOLVED" });
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("renders CLOSED status as 'Closed'", () => {
    renderCard({ status: "CLOSED" });
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("renders the department label for Council_Tax_Or_Housing_Benefit", () => {
    renderCard({ departmentName: "Council_Tax_Or_Housing_Benefit" });
    expect(
      screen.getByText("Council Tax or Housing Benefit"),
    ).toBeInTheDocument();
  });

  it("renders the department chip with default color for an unknown department name", () => {
    const { container } = renderCard({
      departmentName: "Unknown Department" as any,
    });
    expect(
      container.querySelector(".MuiChip-colorDefault"),
    ).toBeInTheDocument();
  });

  it("navigates to the case detail route on chevron button click", () => {
    renderCard();
    fireEvent.click(
      screen.getByRole("button", { name: /view details for case REF001/i }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("./case-1");
  });
});

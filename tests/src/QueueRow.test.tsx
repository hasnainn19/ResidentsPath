import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import QueueRow from "../../src/components/StaffComponents/QueueRow";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const defaultProps = {
  departmentName: "Homelessness",
  waitingCount: 5,
  longestWait: 20,
  averageWait: 15,
  priorityCaseCount: 2,
  standardCaseCount: 3,
  steppedOutCount: 1,
  availableStaff: 4,
};

const renderRow = (overrides = {}) =>
  render(
    <MemoryRouter>
      <table>
        <tbody>
          <QueueRow {...defaultProps} {...overrides} />
        </tbody>
      </table>
    </MemoryRouter>,
  );

describe("QueueRow", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders the department label for a known department", () => {
    renderRow();
    expect(screen.getByText("Homelessness")).toBeInTheDocument();
  });

  it("resolves and renders a label for a multi-word department name", () => {
    renderRow({ departmentName: "Council_Tax_Or_Housing_Benefit" });
    expect(screen.getByText("Council Tax or Housing Benefit")).toBeInTheDocument();
  });

  it("falls back to the raw name for an unknown department", () => {
    renderRow({ departmentName: "Unknown_Dept" });
    expect(screen.getByText("Unknown_Dept")).toBeInTheDocument();
  });

  it("renders the waiting count", () => {
    renderRow();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders longest wait in minutes", () => {
    renderRow();
    expect(screen.getByText("20 mins")).toBeInTheDocument();
  });

  it("renders average wait in minutes", () => {
    renderRow();
    expect(screen.getByText("15 mins")).toBeInTheDocument();
  });

  it("renders -- when longestWait is negative", () => {
    renderRow({ longestWait: -1 });
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });

  it("renders -- when averageWait is negative", () => {
    renderRow({ averageWait: -1 });
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });

  it("renders priority case chip with count", () => {
    renderRow();
    expect(screen.getByText("Priority: 2")).toBeInTheDocument();
  });

  it("renders standard case chip with count", () => {
    renderRow();
    expect(screen.getByText("Standard: 3")).toBeInTheDocument();
  });

  it("renders the stepped out count", () => {
    renderRow();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the available staff count", () => {
    renderRow();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("renders the Adjust button", () => {
    renderRow();
    expect(screen.getByRole("button", { name: /adjust/i })).toBeInTheDocument();
  });

  it("navigates to the queue page with departmentName param on Adjust click", () => {
    renderRow();
    fireEvent.click(screen.getByRole("button", { name: /adjust/i }));
    expect(mockNavigate).toHaveBeenCalledWith(
      "/staff/queues?departmentName=Homelessness",
    );
  });
});

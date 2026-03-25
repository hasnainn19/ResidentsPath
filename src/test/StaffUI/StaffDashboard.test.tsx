import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StaffDashboard from "../../pages/StaffDashboard";

vi.mock("../../hooks/useDashboardStats", () => ({
  default: vi.fn(),
}));

vi.mock("../../hooks/useServiceStats", () => ({
  default: vi.fn(),
}));

import useDashboardStats from "../../hooks/useDashboardStats";
import useServiceStats from "../../hooks/useServiceStats";

const BASE_STATS = {
  waitingCount: 5,
  steppedOutCount: 2,
  staffCount: 8,
  priorityCount: 3,
};

const makeQueue = (departmentName: string, overrides: Record<string, unknown> = {}) => ({
  departmentName,
  waitingCount: 4,
  longestWait: 15,
  averageWait: 10,
  priorityCaseCount: 1,
  standardCaseCount: 3,
  steppedOutCount: 1,
  availableStaff: 2,
  ...overrides,
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <StaffDashboard />
    </MemoryRouter>,
  );
}

describe("StaffDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardStats).mockReturnValue(BASE_STATS);
    vi.mocked(useServiceStats).mockReturnValue([]);
  });

  it("renders the Overview heading", () => {
    renderDashboard();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("renders the Current Queues heading", () => {
    renderDashboard();
    expect(screen.getByText("Current Queues")).toBeInTheDocument();
  });

  it("renders stat cards with values from useDashboardStats", () => {
    renderDashboard();
    expect(screen.getByText("5")).toBeInTheDocument(); // waitingCount
    expect(screen.getByText("2")).toBeInTheDocument(); // steppedOutCount
    expect(screen.getByText("3")).toBeInTheDocument(); // priorityCount
    expect(screen.getByText("8")).toBeInTheDocument(); // staffCount
  });

  it("renders stat card labels", () => {
    renderDashboard();
    expect(screen.getByText("Waiting in reception")).toBeInTheDocument();
    expect(screen.getByText("Stepped Out")).toBeInTheDocument();
    expect(screen.getByText("Urgent Cases")).toBeInTheDocument();
    expect(screen.getByText("Available Staff")).toBeInTheDocument();
  });

  it("renders table column headers", () => {
    renderDashboard();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("Longest Wait")).toBeInTheDocument();
    expect(screen.getByText("Average Wait")).toBeInTheDocument();
    expect(screen.getByText("Stepped Out")).toBeInTheDocument();
    expect(screen.getByText("Available Staff")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders a queue row for each item from useServiceStats", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Alpha"),
      makeQueue("Dept_Beta"),
    ]);
    renderDashboard();
    expect(screen.getByText("Dept_Alpha")).toBeInTheDocument();
    expect(screen.getByText("Dept_Beta")).toBeInTheDocument();
  });

  it("returns queues unsorted when no column is selected", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Zeta"),
      makeQueue("Dept_Alpha"),
    ]);
    renderDashboard();
    const rows = screen.getAllByRole("row");
    // First data row (index 1, since 0 is header) should be Zeta (original order)
    expect(within(rows[1]).getByText("Dept_Zeta")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Alpha")).toBeInTheDocument();
  });

  it("sorts by departmentName ascending when Service header is clicked", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Zeta"),
      makeQueue("Dept_Alpha"),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Service"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Alpha")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Zeta")).toBeInTheDocument();
  });

  it("sorts by departmentName descending when Service is clicked twice", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Alpha"),
      makeQueue("Dept_Zeta"),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Service"));
    fireEvent.click(screen.getByText("Service"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Zeta")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Alpha")).toBeInTheDocument();
  });

  it("resets to asc order when a different column is clicked after sorting", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Alpha", { waitingCount: 10 }),
      makeQueue("Dept_Beta", { waitingCount: 1 }),
    ]);
    renderDashboard();
    // Sort by Service desc
    fireEvent.click(screen.getByText("Service"));
    fireEvent.click(screen.getByText("Service"));
    // Then click Waiting — should reset to asc (lowest waitingCount first)
    fireEvent.click(screen.getByText("Waiting"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Beta")).toBeInTheDocument(); // waitingCount: 1
    expect(within(rows[2]).getByText("Dept_Alpha")).toBeInTheDocument(); // waitingCount: 10
  });

  it("sorts by waitingCount ascending", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_High", { waitingCount: 20 }),
      makeQueue("Dept_Low", { waitingCount: 2 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Waiting"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Low")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_High")).toBeInTheDocument();
  });

  it("sorts by waitingCount descending on second click", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Low", { waitingCount: 2 }),
      makeQueue("Dept_High", { waitingCount: 20 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Waiting"));
    fireEvent.click(screen.getByText("Waiting"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_High")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Low")).toBeInTheDocument();
  });

  it("sorts by longestWait ascending", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Long", { longestWait: 60 }),
      makeQueue("Dept_Short", { longestWait: 5 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Longest Wait"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Short")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Long")).toBeInTheDocument();
  });

  it("sorts by averageWait ascending", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Slow", { averageWait: 30 }),
      makeQueue("Dept_Fast", { averageWait: 5 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Average Wait"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Fast")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Slow")).toBeInTheDocument();
  });

  it("sorts by averageWait descending on second click", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Fast", { averageWait: 5 }),
      makeQueue("Dept_Slow", { averageWait: 30 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Average Wait"));
    fireEvent.click(screen.getByText("Average Wait"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Slow")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Fast")).toBeInTheDocument();
  });

  it("sorts by steppedOutCount ascending", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Many", { steppedOutCount: 10 }),
      makeQueue("Dept_Few", { steppedOutCount: 1 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Stepped Out"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Few")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Many")).toBeInTheDocument();
  });

  it("sorts by steppedOutCount descending on second click", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Few", { steppedOutCount: 1 }),
      makeQueue("Dept_Many", { steppedOutCount: 10 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Stepped Out"));
    fireEvent.click(screen.getByText("Stepped Out"));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Dept_Many")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Few")).toBeInTheDocument();
  });

  it("sorts null values to the end (treats null as Infinity)", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Null", { waitingCount: null as unknown as number }),
      makeQueue("Dept_Real", { waitingCount: 5 }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Waiting"));
    const rows = screen.getAllByRole("row");
    // Real value (5) < Infinity, so it should appear first
    expect(within(rows[1]).getByText("Dept_Real")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Null")).toBeInTheDocument();
  });

  it("sorts null values to the end in descending order", () => {
    vi.mocked(useServiceStats).mockReturnValue([
      makeQueue("Dept_Real", { waitingCount: 5 }),
      makeQueue("Dept_Null", { waitingCount: null as unknown as number }),
    ]);
    renderDashboard();
    fireEvent.click(screen.getByText("Waiting"));
    fireEvent.click(screen.getByText("Waiting"));
    const rows = screen.getAllByRole("row");
    // desc: Infinity > 5, so Null appears first
    expect(within(rows[1]).getByText("Dept_Null")).toBeInTheDocument();
    expect(within(rows[2]).getByText("Dept_Real")).toBeInTheDocument();
  });

  it("applies bold style to the active sort column header", () => {
    renderDashboard();
    fireEvent.click(screen.getByText("Waiting"));
    const waitingHeader = screen.getByText("Waiting");
    // The cell has fontWeight: "bold" when it is the sortColumn
    expect(waitingHeader.closest("th")).toBeInTheDocument();
  });
});

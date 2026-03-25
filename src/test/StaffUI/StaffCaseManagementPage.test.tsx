import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StaffCaseManagementPage from "../../pages/StaffCaseManagementPage";
import type { CaseSummary } from "../../hooks/useCases";

vi.mock("../../hooks/useCases", () => ({
  default: vi.fn(),
}));

import useCases from "../../hooks/useCases";

const BASE_CASE: CaseSummary = {
  id: "case-1",
  caseName: "Test Case",
  referenceNumber: "REF001",
  departmentName: "Homelessness",
  status: "OPEN",
  priority: false,
  flag: false,
  enquiry: "Housing help",
  description: null,
  createdAt: "2024-01-01T10:00:00Z",
};

function makeCase(overrides: Partial<CaseSummary> = {}): CaseSummary {
  return { ...BASE_CASE, ...overrides };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffCaseManagementPage />
    </MemoryRouter>,
  );
}

describe("StaffCaseManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Case Management heading", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: null });
    renderPage();
    expect(screen.getByText("Case Management")).toBeInTheDocument();
  });

  it("shows a loading spinner while loading", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: true, error: null });
    renderPage();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("does not show the case list when loading", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: true, error: null });
    renderPage();
    expect(screen.queryByText("No cases found.")).not.toBeInTheDocument();
  });

  it("shows an error alert when there is an error", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: "Failed to load cases" });
    renderPage();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Failed to load cases")).toBeInTheDocument();
  });

  it("shows 'No cases found.' when the cases list is empty", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: null });
    renderPage();
    expect(screen.getByText("No cases found.")).toBeInTheDocument();
  });

  it("renders case cards for each case", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001" }),
      makeCase({ id: "c2", referenceNumber: "REF002" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
    expect(screen.getByText(/#REF002/)).toBeInTheDocument();
  });

  it("filters cases by enquiry text", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", enquiry: "Housing help needed" }),
      makeCase({ id: "c2", referenceNumber: "REF002", enquiry: "Tax problem" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "housing" },
    });
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
    expect(screen.queryByText(/#REF002/)).not.toBeInTheDocument();
  });

  it("filters cases by description", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", description: "needs urgent shelter" }),
      makeCase({ id: "c2", referenceNumber: "REF002", description: "routine query" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "urgent" },
    });
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
    expect(screen.queryByText(/#REF002/)).not.toBeInTheDocument();
  });

  it("handles null description in search without crashing", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", enquiry: "Housing", description: null }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "housing" },
    });
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
  });

  it("filters cases by reference number", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF123" }),
      makeCase({ id: "c2", referenceNumber: "REF456" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "REF123" },
    });
    expect(screen.getByText(/#REF123/)).toBeInTheDocument();
    expect(screen.queryByText(/#REF456/)).not.toBeInTheDocument();
  });

  it("filters cases by caseName", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", caseName: "Important Housing Case" }),
      makeCase({ id: "c2", referenceNumber: "REF002", caseName: "Routine Tax Query" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "important" },
    });
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
    expect(screen.queryByText(/#REF002/)).not.toBeInTheDocument();
  });

  it("handles null caseName in search without crashing", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", caseName: null as unknown as string }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "housing" },
    });
    expect(screen.getByText(/#REF001/)).toBeInTheDocument();
  });

  it("shows 'No cases found.' when search matches nothing", () => {
    const cases = [makeCase({ referenceNumber: "REF001", enquiry: "Housing" })];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "zzznomatch" },
    });
    expect(screen.getByText("No cases found.")).toBeInTheDocument();
  });

  it("returns all cases when search is cleared", () => {
    const cases = [
      makeCase({ id: "c1", referenceNumber: "REF001", enquiry: "Housing" }),
      makeCase({ id: "c2", referenceNumber: "REF002", enquiry: "Tax" }),
    ];
    vi.mocked(useCases).mockReturnValue({ cases, loading: false, error: null });
    renderPage();
    const searchInput = screen.getByPlaceholderText("Search cases...");
    fireEvent.change(searchInput, { target: { value: "housing" } });
    expect(screen.queryByText(/#REF002/)).not.toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText(/#REF002/)).toBeInTheDocument();
  });

  it("calls useCases with the selected status filter", async () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: null });
    renderPage();
    // Open the status Select
    const statusComboboxes = screen.getAllByRole("combobox");
    fireEvent.mouseDown(statusComboboxes[0]);
    await waitFor(() => screen.getByRole("listbox"));
    fireEvent.click(screen.getByRole("option", { name: "Open" }));
    await waitFor(() => {
      expect(vi.mocked(useCases)).toHaveBeenCalledWith(
        expect.objectContaining({ status: "OPEN" }),
      );
    });
  });

  it("calls useCases with the selected department filter", async () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: null });
    renderPage();
    // The department Select is the second combobox
    const comboboxes = screen.getAllByRole("combobox");
    fireEvent.mouseDown(comboboxes[1]);
    await waitFor(() => screen.getByRole("listbox"));
    fireEvent.click(screen.getByRole("option", { name: "Homelessness" }));
    await waitFor(() => {
      expect(vi.mocked(useCases)).toHaveBeenCalledWith(
        expect.objectContaining({ departmentName: "Homelessness" }),
      );
    });
  });

  it("passes initial empty filters to useCases", () => {
    vi.mocked(useCases).mockReturnValue({ cases: [], loading: false, error: null });
    renderPage();
    expect(vi.mocked(useCases)).toHaveBeenCalledWith(
      expect.objectContaining({ status: "", departmentName: "" }),
    );
  });
});

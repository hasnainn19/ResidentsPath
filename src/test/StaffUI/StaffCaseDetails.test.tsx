import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StaffCaseDetails from "../../pages/StaffCaseDetails";
import useCaseDetails from "../../hooks/useCaseDetails";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockUseParams = vi.fn().mockReturnValue({ caseId: "case-123" });
const mockCaseUpdate = vi.fn().mockResolvedValue({});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useParams: () => mockUseParams(), useNavigate: () => mockNavigate };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({ models: { Case: { update: mockCaseUpdate } } }),
}));

vi.mock("../../hooks/useCaseDetails", () => ({ default: vi.fn() }));

// ── Fixture ────────────────────────────────────────────────────────────────
const FULL_CASE = {
  caseName: "Housing Case",
  referenceNumber: "REF001",
  departmentName: "Housing",
  description: "Test description",
  status: "OPEN" as const,
  priority: true,
  flag: true,
  notes: "Some notes",
  enquiry: "Housing help needed",
  childrenCount: "2",
  householdSize: "4",
  ageRange: "AGE_25_34",
  hasDisabilityOrSensory: true,
  disabilityType: "VISUAL_IMPAIRMENT",
  domesticAbuse: true,
  safeToContact: "yes",
  safeContactNotes: "Call after 3pm",
  urgent: "yes",
  urgentReason: "HEALTH_OR_MOBILITY",
  urgentReasonOtherText: "Specific reason details",
  supportNotes: "Needs interpreter",
  supportNeeds: ["LANGUAGE"],
  otherSupport: "Large print documents",
  additionalInfo: "Extra context here",
  residentName: "Jane Doe",
  tickets: [{ ticketId: "ticket-1", ticketStatus: "WAITING" }],
};

// ── Helpers ────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockWith(overrides: Record<string, any> = {}) {
  vi.mocked(useCaseDetails).mockReturnValue({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    caseDetails: { ...FULL_CASE, ...overrides } as any,
    loading: false,
    error: null,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <StaffCaseDetails />
    </MemoryRouter>,
  );
}

// The notes edit IconButton has no aria-label; it's the only such button in the main view.
const getNotesEditBtn = () =>
  screen.getAllByRole("button").find((btn) => !btn.getAttribute("aria-label"))!;

async function openNotesModal() {
  fireEvent.click(getNotesEditBtn());
  await waitFor(() => screen.getByText("Edit Notes"));
}

async function openCaseNameModal() {
  fireEvent.click(screen.getByLabelText("Edit case name"));
  await waitFor(() => screen.getByText("Set Case Title"));
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("StaffCaseDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ caseId: "case-123" });
  });

  // ── Loading / error / not-found ────────────────────────────────────────
  it("shows spinner while loading", () => {
    vi.mocked(useCaseDetails).mockReturnValue({ caseDetails: null, loading: true, error: null });
    renderPage();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows error message and back button navigates when error is set", () => {
    vi.mocked(useCaseDetails).mockReturnValue({
      caseDetails: null,
      loading: false,
      error: "Case fetch failed",
    });
    renderPage();
    expect(screen.getByText("Case fetch failed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("shows 'Case not found.' when case is null with no error", () => {
    vi.mocked(useCaseDetails).mockReturnValue({ caseDetails: null, loading: false, error: null });
    renderPage();
    expect(screen.getByText("Case not found.")).toBeInTheDocument();
  });

  // ── Main view ──────────────────────────────────────────────────────────
  it("renders case reference, department, resident name, and enquiry", () => {
    mockWith();
    renderPage();
    expect(screen.getByText(/REF001/)).toBeInTheDocument();
    expect(screen.getByText(/Housing/)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Housing help needed")).toBeInTheDocument();
  });

  it("navigates back when Go back button is clicked", () => {
    mockWith();
    renderPage();
    fireEvent.click(screen.getByLabelText("Go back"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  // ── Priority / Flagged chips ────────────────────────────────────────────
  it("shows Priority chip when priority is true", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("hides Priority chip when priority is false", () => {
    mockWith({ priority: false });
    renderPage();
    expect(screen.queryByText("Priority")).not.toBeInTheDocument();
  });

  it("shows Flagged chip when flag is true", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Flagged")).toBeInTheDocument();
  });

  it("hides Flagged chip when flag is false", () => {
    mockWith({ flag: false });
    renderPage();
    expect(screen.queryByText("Flagged")).not.toBeInTheDocument();
  });

  // ── Status select ──────────────────────────────────────────────────────
  it("calls Case.update when status changes", async () => {
    mockWith();
    renderPage();
    fireEvent.change(screen.getByDisplayValue("OPEN"), { target: { value: "RESOLVED" } });
    await waitFor(() =>
      expect(mockCaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "case-123", status: "RESOLVED" }),
      ),
    );
  });

  it("does not call Case.update for status when caseId is empty", async () => {
    mockUseParams.mockReturnValue({ caseId: "" });
    mockWith();
    renderPage();
    fireEvent.change(screen.getByDisplayValue("OPEN"), { target: { value: "RESOLVED" } });
    await waitFor(() => expect(mockCaseUpdate).not.toHaveBeenCalled());
  });

  // ── Resident details ───────────────────────────────────────────────────
  it("shows safeContactNotes when present", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Call after 3pm")).toBeInTheDocument();
  });

  it("hides Safe to Contact Notes row when safeContactNotes is null", () => {
    mockWith({ safeContactNotes: null });
    renderPage();
    expect(screen.queryByText("Safe to Contact Notes")).not.toBeInTheDocument();
  });

  // ── Vulnerability & support ────────────────────────────────────────────
  it("shows disability label when hasDisabilityOrSensory is true", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Visual impairment")).toBeInTheDocument();
  });

  it("shows 'None reported' when hasDisabilityOrSensory is false", () => {
    mockWith({ hasDisabilityOrSensory: false });
    renderPage();
    expect(screen.getByText("None reported")).toBeInTheDocument();
  });

  it("shows 'Yes' for domesticAbuse when true", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows 'No' for domesticAbuse when false", () => {
    mockWith({ domesticAbuse: false });
    renderPage();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders Support Needs chips when supportNeeds is non-empty", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Support Needs")).toBeInTheDocument();
    expect(screen.getByText("Language")).toBeInTheDocument();
  });

  it("hides Support Needs section when supportNeeds is empty", () => {
    mockWith({ supportNeeds: [] });
    renderPage();
    expect(screen.queryByText("Support Needs")).not.toBeInTheDocument();
  });

  it("shows Other Support when present", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Large print documents")).toBeInTheDocument();
  });

  it("hides Other Support row when otherSupport is null", () => {
    mockWith({ otherSupport: null });
    renderPage();
    expect(screen.queryByText("Large print documents")).not.toBeInTheDocument();
  });

  // ── Urgency ────────────────────────────────────────────────────────────
  it("renders Urgency section with label when urgent is 'yes'", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Urgency")).toBeInTheDocument();
    expect(screen.getByText("Health or mobility")).toBeInTheDocument();
  });

  it("hides Urgency section when urgent is not 'yes'", () => {
    mockWith({ urgent: "no" });
    renderPage();
    expect(screen.queryByText("Urgency")).not.toBeInTheDocument();
  });

  it("renders urgentReasonOtherText when present", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Specific reason details")).toBeInTheDocument();
  });

  it("hides Additional Urgency Details row when urgentReasonOtherText is null", () => {
    mockWith({ urgentReasonOtherText: null });
    renderPage();
    expect(screen.queryByText("Additional Urgency Details")).not.toBeInTheDocument();
  });

  // ── Notes & additional info ────────────────────────────────────────────
  it("shows 'No notes yet.' when notes is null", () => {
    mockWith({ notes: null });
    renderPage();
    expect(screen.getByText("No notes yet.")).toBeInTheDocument();
  });

  it("shows additionalInfo when present", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Extra context here")).toBeInTheDocument();
  });

  it("hides Additional Info row when additionalInfo is null", () => {
    mockWith({ additionalInfo: null });
    renderPage();
    expect(screen.queryByText("Extra context here")).not.toBeInTheDocument();
  });

  // ── Linked tickets ─────────────────────────────────────────────────────
  it("renders Linked Tickets section when tickets are present", () => {
    mockWith();
    renderPage();
    expect(screen.getByText("Linked Tickets")).toBeInTheDocument();
    expect(screen.getByText("Ticket #ticket-1")).toBeInTheDocument();
    expect(screen.getByText("WAITING")).toBeInTheDocument();
  });

  it("hides Linked Tickets section when tickets array is empty", () => {
    mockWith({ tickets: [] });
    renderPage();
    expect(screen.queryByText("Linked Tickets")).not.toBeInTheDocument();
  });

  // ── Edit notes modal ───────────────────────────────────────────────────
  it("opens Edit Notes dialog with pre-populated notes", async () => {
    mockWith();
    renderPage();
    await openNotesModal();
    expect(screen.getByDisplayValue("Some notes")).toBeInTheDocument();
  });

  it("saves notes and closes dialog on success", async () => {
    mockWith();
    renderPage();
    await openNotesModal();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(mockCaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "case-123", notes: "Some notes" }),
      ),
    );
    await waitFor(() => expect(screen.queryByText("Edit Notes")).not.toBeInTheDocument());
  });

  it("shows alert and keeps dialog open when saving notes fails", async () => {
    mockCaseUpdate.mockRejectedValueOnce(new Error("write error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockWith();
    renderPage();
    await openNotesModal();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save notes. Please try again."),
    );
    expect(screen.getByText("Edit Notes")).toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it("does not call Case.update for notes when caseId is empty", async () => {
    mockUseParams.mockReturnValue({ caseId: "" });
    mockWith();
    renderPage();
    await openNotesModal();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockCaseUpdate).not.toHaveBeenCalled());
  });

  it("closes Edit Notes dialog on Cancel", async () => {
    mockWith();
    renderPage();
    await openNotesModal();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByText("Edit Notes")).not.toBeInTheDocument());
  });

  // ── Edit case name modal ────────────────────────────────────────────────
  it("opens Set Case Title dialog with pre-populated name", async () => {
    mockWith();
    renderPage();
    await openCaseNameModal();
    expect(screen.getByDisplayValue("Housing Case")).toBeInTheDocument();
  });

  it("saves case name and closes dialog on success", async () => {
    mockWith();
    renderPage();
    await openCaseNameModal();
    fireEvent.change(screen.getByDisplayValue("Housing Case"), {
      target: { value: "Updated Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(mockCaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: "case-123", name: "Updated Name" }),
      ),
    );
    await waitFor(() => expect(screen.queryByText("Set Case Title")).not.toBeInTheDocument());
  });

  it("shows alert and keeps dialog open when saving case name fails", async () => {
    mockCaseUpdate.mockRejectedValueOnce(new Error("save error"));
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    mockWith();
    renderPage();
    await openCaseNameModal();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Unable to save case name. Please try again."),
    );
    expect(screen.getByText("Set Case Title")).toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it("does not call Case.update for case name when caseId is empty", async () => {
    mockUseParams.mockReturnValue({ caseId: "" });
    mockWith();
    renderPage();
    await openCaseNameModal();
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockCaseUpdate).not.toHaveBeenCalled());
  });

  it("closes Set Case Title dialog on Cancel", async () => {
    mockWith();
    renderPage();
    await openCaseNameModal();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByText("Set Case Title")).not.toBeInTheDocument());
  });

  it("truncates case name input to 50 characters", async () => {
    mockWith();
    renderPage();
    await openCaseNameModal();
    const input = screen.getByDisplayValue("Housing Case");
    fireEvent.change(input, { target: { value: "A".repeat(60) } });
    expect((input as HTMLInputElement).value).toBe("A".repeat(50));
  });
});

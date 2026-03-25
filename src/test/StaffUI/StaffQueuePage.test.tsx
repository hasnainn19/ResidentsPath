import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StaffQueuePage from "../../pages/StaffQueuePage";
import useQueueItems, { type QueueItem } from "../../hooks/useQueueItems";

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockMarkTicketSeen = vi.fn().mockResolvedValue({});
const mockAdjustQueuePosition = vi.fn().mockResolvedValue({});

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    mutations: {
      markTicketSeen: mockMarkTicketSeen,
      adjustQueuePosition: mockAdjustQueuePosition,
    },
  }),
}));

vi.mock("../../hooks/useQueueItems", () => ({ default: vi.fn() }));

// ── Fixtures ───────────────────────────────────────────────────────────────
const BASE_ITEM: QueueItem = {
  ticketId: "ticket-1",
  caseId: "case-1",
  ticketNumber: "T001",
  department: "Homelessness",
  title: "REF001",
  description: "Housing help",
  priority: false,
  flag: false,
  position: 1,
  notes: null,
  createdAt: "2024-01-01T10:00:00Z",
};

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return { ...BASE_ITEM, ...overrides };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function mockItems(...items: QueueItem[]) {
  vi.mocked(useQueueItems).mockReturnValue({ items, loading: false, error: null });
}

function renderPage(search = "") {
  return render(
    <MemoryRouter initialEntries={[`/staff/queues${search}`]}>
      <Routes>
        <Route path="/staff/queues" element={<StaffQueuePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// Opens the confirm modal by selecting position 2 for the first item.
// Caller must call mockItems() with ≥ 2 items before calling this.
async function openPositionModal() {
  renderPage("?departmentName=Homelessness");
  const [, positionCombobox] = screen.getAllByRole("combobox");
  fireEvent.mouseDown(positionCombobox);
  await waitFor(() => screen.getByRole("listbox"));
  // Item at position 1 has Select value "position+1"="2"; click "1" to trigger a real change.
  fireEvent.click(screen.getAllByRole("option", { name: "1" })[0]);
  await waitFor(() => screen.getByText("Confirm Change"));
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("StaffQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Title & hook arg ───────────────────────────────────────────────────
  it("renders 'Manage Tickets' when no departmentName param", () => {
    mockItems();
    renderPage();
    expect(screen.getByText("Manage Tickets")).toBeInTheDocument();
  });

  it("renders department name as title and passes it to useQueueItems", () => {
    mockItems();
    renderPage("?departmentName=Childrens_Duty");
    expect(screen.getByText("Childrens Duty")).toBeInTheDocument();
    expect(vi.mocked(useQueueItems)).toHaveBeenCalledWith("Childrens_Duty");
  });

  // ── Loading / empty states ─────────────────────────────────────────────
  it("shows spinner while loading", () => {
    vi.mocked(useQueueItems).mockReturnValue({ items: [], loading: true, error: null });
    renderPage();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows 'Queue is empty' when items array is empty", () => {
    mockItems();
    renderPage();
    expect(screen.getByText("Queue is empty")).toBeInTheDocument();
  });

  it("shows 'Queue is empty' when search matches nothing", () => {
    mockItems(makeItem({ title: "REF001" }));
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "zzznomatch" },
    });
    expect(screen.getByText("Queue is empty")).toBeInTheDocument();
  });

  // ── Item rendering ─────────────────────────────────────────────────────
  it("renders multiple queue items", () => {
    mockItems(
      makeItem({ ticketId: "t1", title: "REF001" }),
      makeItem({ ticketId: "t2", caseId: "c2", title: "REF002" }),
    );
    renderPage();
    expect(screen.getByText("REF001")).toBeInTheDocument();
    expect(screen.getByText("REF002")).toBeInTheDocument();
  });

  it("maps priority=true to 'Priority' status chip", () => {
    mockItems(makeItem({ priority: true }));
    renderPage();
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("maps priority=false to 'Standard' status chip", () => {
    mockItems(makeItem({ priority: false }));
    renderPage();
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  // ── Search filter ──────────────────────────────────────────────────────
  it("filters items by title (case-insensitive)", () => {
    mockItems(
      makeItem({ ticketId: "t1", title: "Housing REF001", description: "shelter query" }),
      makeItem({ ticketId: "t2", title: "Tax REF002", description: "council tax query" }),
    );
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "housing" },
    });
    expect(screen.getByText("Housing REF001")).toBeInTheDocument();
    expect(screen.queryByText("Tax REF002")).not.toBeInTheDocument();
  });

  it("filters items by description (case-insensitive)", () => {
    mockItems(
      makeItem({ ticketId: "t1", title: "REF001", description: "urgent shelter needed" }),
      makeItem({ ticketId: "t2", title: "REF002", description: "routine enquiry" }),
    );
    renderPage();
    fireEvent.change(screen.getByPlaceholderText("Search cases..."), {
      target: { value: "urgent" },
    });
    expect(screen.getByText("REF001")).toBeInTheDocument();
    expect(screen.queryByText("REF002")).not.toBeInTheDocument();
  });

  // ── Sorting ────────────────────────────────────────────────────────────
  it("sorts by queue position by default", () => {
    mockItems(
      makeItem({ ticketId: "t1", title: "Second", position: 2 }),
      makeItem({ ticketId: "t2", title: "First", position: 1 }),
    );
    renderPage();
    const items = screen.getAllByText(/^(First|Second)$/);
    expect(items[0].textContent).toBe("First");
    expect(items[1].textContent).toBe("Second");
  });

  it("sorts by newest first", async () => {
    const now = Date.now();
    mockItems(
      makeItem({ ticketId: "t1", title: "Old", createdAt: new Date(now - 10000).toISOString() }),
      makeItem({ ticketId: "t2", title: "New", createdAt: new Date(now).toISOString() }),
    );
    renderPage();
    fireEvent.mouseDown(screen.getByRole("combobox"));
    await waitFor(() => screen.getByRole("listbox"));
    fireEvent.click(screen.getByRole("option", { name: "Newest First" }));
    const items = screen.getAllByText(/^(Old|New)$/);
    expect(items[0].textContent).toBe("New");
    expect(items[1].textContent).toBe("Old");
  });

  it("sorts by oldest first", async () => {
    const now = Date.now();
    mockItems(
      makeItem({ ticketId: "t1", title: "New", createdAt: new Date(now).toISOString() }),
      makeItem({ ticketId: "t2", title: "Old", createdAt: new Date(now - 10000).toISOString() }),
    );
    renderPage();
    fireEvent.mouseDown(screen.getByRole("combobox"));
    await waitFor(() => screen.getByRole("listbox"));
    fireEvent.click(screen.getByRole("option", { name: "Oldest First" }));
    const items = screen.getAllByText(/^(Old|New)$/);
    expect(items[0].textContent).toBe("Old");
    expect(items[1].textContent).toBe("New");
  });

  // ── Position selector visibility ───────────────────────────────────────
  it("hides position selector when no departmentName in search params", () => {
    mockItems(makeItem());
    renderPage();
    expect(screen.queryAllByText("Move to position")).toHaveLength(0);
  });

  it("shows position selector when departmentName is in search params", () => {
    mockItems(makeItem());
    renderPage("?departmentName=Homelessness");
    expect(screen.getAllByText("Move to position").length).toBeGreaterThan(0);
  });

  // ── Mark as seen ───────────────────────────────────────────────────────
  it("calls markTicketSeen when mark as seen is confirmed", async () => {
    mockItems(makeItem({ ticketId: "ticket-99" }));
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /mark as seen/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() =>
      expect(mockMarkTicketSeen).toHaveBeenCalledWith({ ticketId: "ticket-99" }),
    );
  });

  it("logs error when markTicketSeen fails", async () => {
    mockMarkTicketSeen.mockRejectedValueOnce(new Error("network failure"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockItems(makeItem({ ticketId: "ticket-99" }));
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /mark as seen/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });

  // ── Position change modal ──────────────────────────────────────────────
  it("opens confirm modal when a new position is selected", async () => {
    mockItems(
      makeItem({ ticketId: "t1", position: 1 }),
      makeItem({ ticketId: "t2", caseId: "c2", position: 2 }),
    );
    await openPositionModal();
    expect(screen.getByText("Confirm Change")).toBeInTheDocument();
  });

  it("closes confirm modal when Cancel is clicked", async () => {
    mockItems(
      makeItem({ ticketId: "t1", position: 1 }),
      makeItem({ ticketId: "t2", caseId: "c2", position: 2 }),
    );
    await openPositionModal();
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => expect(screen.queryByText("Confirm Change")).not.toBeInTheDocument());
  });

  it("calls adjustQueuePosition with correct args when position change is confirmed", async () => {
    mockItems(
      makeItem({ ticketId: "t1", position: 1 }),
      makeItem({ ticketId: "t2", caseId: "c2", position: 2 }),
    );
    await openPositionModal();
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() =>
      expect(mockAdjustQueuePosition).toHaveBeenCalledWith({ ticketId: "t1", newPosition: 1 }),
    );
  });

  it("logs error when adjustQueuePosition fails", async () => {
    mockAdjustQueuePosition.mockRejectedValueOnce(new Error("api error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockItems(
      makeItem({ ticketId: "t1", position: 1 }),
      makeItem({ ticketId: "t2", caseId: "c2", position: 2 }),
    );
    await openPositionModal();
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });
});

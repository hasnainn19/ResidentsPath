import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import CurrentQueueItem from "../../components/StaffComponents/CurrentQueueItem";

const mockUpdate = vi.fn().mockResolvedValue({});
const mockSetCasePriority = vi.fn().mockResolvedValue({});
const mockFlagCaseSafeguarding = vi.fn().mockResolvedValue({});

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    mutations: {
      setCasePriority: mockSetCasePriority,
      flagCaseSafeguarding: mockFlagCaseSafeguarding,
    },
    models: {
      Ticket: {
        update: mockUpdate,
      },
    },
  }),
}));

const baseCaseItem = {
  id: "ticket-1",
  caseId: "case-1",
  ticketNumber: "T001",
  department: "Homelessness",
  title: "Housing support needed",
  description: "Resident needs emergency housing.",
  status: "Standard" as "Priority" | "Standard",
  isFlagged: false,
  position: 1,
  notes: "Initial note",
};

const renderItem = (
  caseOverrides: Partial<typeof baseCaseItem> = {},
  propOverrides: Partial<{
    totalPositions: number;
    showPosition: boolean;
    handleSelectPosition: (id: string, pos: number) => void;
    handleMarkSeen: (id: string) => void;
  }> = {},
) =>
  render(
    <CurrentQueueItem
      caseItem={{ ...baseCaseItem, ...caseOverrides }}
      totalPositions={5}
      handleSelectPosition={vi.fn()}
      handleMarkSeen={vi.fn()}
      showPosition={true}
      {...propOverrides}
    />,
  );

describe("CurrentQueueItem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ticket number", () => {
    renderItem();
    expect(screen.getByText("#T001")).toBeInTheDocument();
  });

  it("renders the case title", () => {
    renderItem();
    expect(screen.getByText("Housing support needed")).toBeInTheDocument();
  });

  it("renders the description", () => {
    renderItem();
    expect(
      screen.getByText("Resident needs emergency housing."),
    ).toBeInTheDocument();
  });

  it("renders 'Standard' status chip", () => {
    renderItem();
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("renders 'Priority' status chip when status is Priority", () => {
    renderItem({ status: "Priority" });
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("renders the Mark as Seen button", () => {
    renderItem();
    expect(
      screen.getByRole("button", { name: /mark as seen/i }),
    ).toBeInTheDocument();
  });

  it("renders the View/Edit Notes button", () => {
    renderItem();
    expect(
      screen.getByRole("button", { name: /view\/edit notes/i }),
    ).toBeInTheDocument();
  });

  it("renders the position selector when showPosition is true", () => {
    renderItem();
    // MUI Select renders the label text in both a <label> and a floating <span>
    expect(screen.getAllByText("Move to position").length).toBeGreaterThan(0);
  });

  it("does not render the position selector when showPosition is false", () => {
    renderItem({}, { showPosition: false });
    expect(screen.queryAllByText("Move to position")).toHaveLength(0);
  });

  it("opens the notes dialog when View/Edit Notes is clicked", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows the case title in the notes dialog header", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Notes — Housing support needed/),
      ).toBeInTheDocument();
    });
  });

  it("populates the notes textarea with existing notes from the base case", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Initial note")).toBeInTheDocument();
    });
  });

  it("initialises notes state to empty string when notes prop is null", async () => {
    // Covers the ?? "" branch on useState(caseItem.notes ?? "")
    render(
      <CurrentQueueItem
        caseItem={{ ...baseCaseItem, notes: null }}
        totalPositions={5}
        handleSelectPosition={vi.fn()}
        handleMarkSeen={vi.fn()}
        showPosition={true}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  it("opens the confirm modal when Mark as Seen is clicked", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /mark as seen/i }));
    await waitFor(() => {
      expect(screen.getByText("Confirm Change")).toBeInTheDocument();
    });
  });

  it("calls handleMarkSeen with the ticket id when seen confirm modal is confirmed", async () => {
    const handleMarkSeen = vi.fn();
    render(
      <CurrentQueueItem
        caseItem={baseCaseItem}
        totalPositions={5}
        handleSelectPosition={vi.fn()}
        handleMarkSeen={handleMarkSeen}
        showPosition={true}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /mark as seen/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(handleMarkSeen).toHaveBeenCalledWith("ticket-1");
  });

  it("shows the confirm modal when Save is clicked inside the notes dialog", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => {
      expect(screen.getByText("Confirm Change")).toBeInTheDocument();
    });
  });

  it("saves notes via client when notes confirm modal is confirmed", async () => {
    renderItem({ notes: "Test note" });
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: "ticket-1",
        notes: "Test note",
      });
    });
  });

  it("toggles priority via mutation when Set to Priority is selected from the menu", async () => {
    renderItem({ status: "Standard" });
    // MUI Tooltip clones its title as aria-label onto the IconButton child
    fireEvent.click(screen.getByRole("button", { name: /edit priority/i }));
    await waitFor(() => screen.getByText("Set to Priority"));
    fireEvent.click(screen.getByText("Set to Priority"));
    await waitFor(() => {
      expect(mockSetCasePriority).toHaveBeenCalledWith({
        caseId: "case-1",
        priority: true,
      });
    });
  });

  it("toggles priority back to Standard when Set to Standard is selected", async () => {
    renderItem({ status: "Priority" });
    fireEvent.click(screen.getByRole("button", { name: /edit priority/i }));
    await waitFor(() => screen.getByText("Set to Standard"));
    fireEvent.click(screen.getByText("Set to Standard"));
    await waitFor(() => {
      expect(mockSetCasePriority).toHaveBeenCalledWith({
        caseId: "case-1",
        priority: false,
      });
    });
  });

  it("calls flagCaseSafeguarding when the flag button is clicked", async () => {
    renderItem({ isFlagged: false });
    // MUI Tooltip wraps a <span> child, so aria-label lands on the span — find the button inside
    const flagSpan = screen.getByLabelText("Flag case");
    fireEvent.click(flagSpan.querySelector("button")!);
    await waitFor(() => {
      expect(mockFlagCaseSafeguarding).toHaveBeenCalledWith({
        caseId: "case-1",
        flagged: true,
      });
    });
  });

  it("calls flagCaseSafeguarding to clear flag when already flagged", async () => {
    renderItem({ isFlagged: true });
    const flagSpan = screen.getByLabelText("Clear case flag");
    fireEvent.click(flagSpan.querySelector("button")!);
    await waitFor(() => {
      expect(mockFlagCaseSafeguarding).toHaveBeenCalledWith({
        caseId: "case-1",
        flagged: false,
      });
    });
  });

  it("calls handleSelectPosition when the position dropdown is changed", async () => {
    const handleSelectPosition = vi.fn();
    renderItem({}, { handleSelectPosition });
    fireEvent.mouseDown(screen.getByRole("combobox"));
    await waitFor(() => screen.getByRole("listbox"));
    fireEvent.click(within(screen.getByRole("listbox")).getByText("3"));
    expect(handleSelectPosition).toHaveBeenCalledWith("ticket-1", 3);
  });

  it("closes the priority menu on Escape without selecting an option", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /edit priority/i }));
    await waitFor(() => screen.getByText("Set to Priority"));
    fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Set to Priority")).not.toBeInTheDocument();
    });
  });

  it("updates notes state as the user types in the notes dialog", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Updated text" } });
    expect(screen.getByRole("textbox")).toHaveValue("Updated text");
  });

  it("closes the notes dialog when Cancel is clicked", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the notes dialog when pressing Escape", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the notes confirm modal when its Cancel is clicked without saving", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /view\/edit notes/i }));
    await waitFor(() => screen.getByRole("dialog"));
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    const cancelButtons = screen.getAllByRole("button", { name: /^cancel$/i });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText("Confirm Change")).not.toBeInTheDocument();
    });
  });

  it("triggers the seen confirm modal handleClose when Cancel is clicked", async () => {
    renderItem();
    fireEvent.click(screen.getByRole("button", { name: /mark as seen/i }));
    await waitFor(() => screen.getByText("Confirm Change"));
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(screen.getByText("Confirm Change")).toBeInTheDocument();
  });

  describe("error alerts", () => {
    it("shows an alert when setCasePriority fails", async () => {
      mockSetCasePriority.mockRejectedValueOnce(new Error("network error"));

      renderItem({ status: "Standard" });
      fireEvent.click(screen.getByRole("button", { name: /edit priority/i }));
      await waitFor(() => screen.getByText("Set to Priority"));
      fireEvent.click(screen.getByText("Set to Priority"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to update priority. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("shows an alert when flagCaseSafeguarding fails", async () => {
      mockFlagCaseSafeguarding.mockRejectedValueOnce(
        new Error("network error"),
      );

      renderItem({ isFlagged: false });
      const flagSpan = screen.getByLabelText("Flag case");
      fireEvent.click(flagSpan.querySelector("button")!);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to update flag. Please try again."),
        ).toBeInTheDocument();
      });
    });

    it("shows an alert when Ticket.update fails on save notes", async () => {
      mockUpdate.mockRejectedValueOnce(new Error("write failed"));

      renderItem({ notes: "Some note" });
      fireEvent.click(
        screen.getByRole("button", { name: /view\/edit notes/i }),
      );
      await waitFor(() => screen.getByRole("dialog"));
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
      await waitFor(() => screen.getByText("Confirm Change"));
      fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(
          screen.getByText("Failed to save notes. Please try again."),
        ).toBeInTheDocument();
      });
    });
  });
});
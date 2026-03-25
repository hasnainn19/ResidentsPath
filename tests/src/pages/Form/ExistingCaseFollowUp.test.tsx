import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

const {
  mockNavigate,
  mockGenerateClient,
  mockGetCaseFollowUp,
  mockSubmitCaseFollowUp,
  mockGetDataAuthMode,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGenerateClient: vi.fn(),
  mockGetCaseFollowUp: vi.fn(),
  mockSubmitCaseFollowUp: vi.fn(),
  mockGetDataAuthMode: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

vi.mock("../../../../src/utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

vi.mock("../../../../src/components/FormPageComponents/FormStepLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/components/FormPageComponents/WithTTS", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/components/FormPageComponents/LongTextSection", () => ({
  default: ({
    copy,
    value,
    onChange,
    placeholder,
  }: {
    copy: { label?: string };
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <div>
      <div>{copy.label}</div>
      <textarea
        aria-label={copy.label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  ),
}));

vi.mock("../../../../src/components/FormPageComponents/OptionTile", () => ({
  default: ({
    title,
    disabled,
    onClick,
  }: {
    title: string;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {title}
    </button>
  ),
}));

vi.mock("../../../../src/components/BookingPanel", () => ({
  default: ({
    departmentName,
    onConfirm,
  }: {
    departmentName?: string;
    onConfirm: (dateIso: string, time: string) => void;
  }) => (
    <div>
      <div>Booking panel for {departmentName ?? "unknown department"}</div>
      <button type="button" onClick={() => onConfirm("2026-06-14", "09:45")}>
        Confirm appointment
      </button>
    </div>
  ),
}));

import ExistingCaseFollowUp from "../../../../src/pages/Form/ExistingCaseFollowUp";

function renderPage() {
  return render(<ExistingCaseFollowUp />);
}

function makeLookupResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      found: true,
      referenceNumber: "ABC-DEF234",
      departmentName: "Homelessness",
      hasActiveWaitingTicket: false,
      hasReachedAppointmentLimit: false,
      ...overrides,
    },
    errors: undefined,
  };
}

function makeSubmitResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      ok: true,
      referenceNumber: "ABC-DEF234",
      ...overrides,
    },
    errors: undefined,
  };
}

async function lookupCase(user: ReturnType<typeof userEvent.setup>, reference = "abc-def234") {
  const input = screen.getByRole("textbox", { name: "Case reference number" });

  await user.clear(input);
  await user.type(input, reference);
  await user.click(screen.getByRole("button", { name: "Find case" }));
}

describe("ExistingCaseFollowUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      queries: {
        getCaseFollowUp: mockGetCaseFollowUp,
      },
      mutations: {
        submitCaseFollowUp: mockSubmitCaseFollowUp,
      },
    });
    mockGetDataAuthMode.mockResolvedValue("identityPool");
    mockGetCaseFollowUp.mockResolvedValue(makeLookupResponse());
    mockSubmitCaseFollowUp.mockResolvedValue(makeSubmitResponse());
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  it("shows a validation error for an invalid case reference number", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user, "abc");

    expect(await screen.findByText("Enter a valid case reference number.")).toBeInTheDocument();
    expect(mockGetCaseFollowUp).not.toHaveBeenCalled();
  });

  it("shows a required error when the case reference number is blank", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user, "   ");

    expect(await screen.findByText("Enter a case reference number.")).toBeInTheDocument();
    expect(mockGetCaseFollowUp).not.toHaveBeenCalled();
  });

  it("normalises the case reference number before lookup", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user, "   abc-def234   ");

    await waitFor(() => {
      expect(mockGetCaseFollowUp).toHaveBeenCalledWith(
        { referenceNumber: "ABC-DEF234" },
        { authMode: "identityPool" },
      );
    });

    expect(screen.getByRole("textbox", { name: "Case reference number" })).toHaveValue(
      "ABC-DEF234",
    );
  });

  it("shows the looked-up case details after a successful lookup", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user, "ABC-DEF234");

    expect(await screen.findByText("Case found: ABC-DEF234")).toBeInTheDocument();
    expect(screen.getByText("Service area: Homelessness")).toBeInTheDocument();
  });

  it("shows the lookup error returned by the backend when no case is found", async () => {
    mockGetCaseFollowUp.mockResolvedValue({
      data: {
        found: false,
        errorMessage: "We could not find that case.",
      },
      errors: undefined,
    });

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(await screen.findByText("We could not find that case.")).toBeInTheDocument();
    expect(screen.queryByText("Case found: ABC-DEF234")).not.toBeInTheDocument();
  });

  it("shows a generic lookup error when the case cannot be loaded", async () => {
    mockGetCaseFollowUp.mockRejectedValue(new Error("Network down"));

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(
      await screen.findByText("We could not load that case right now."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Case found: ABC-DEF234")).not.toBeInTheDocument();
  });

  it("shows the lookup error when the backend returns errors", async () => {
    mockGetCaseFollowUp.mockResolvedValue({
      data: null,
      errors: [{ message: "Lookup temporarily unavailable." }],
    });

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(await screen.findByText("Lookup temporarily unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("Case found: ABC-DEF234")).not.toBeInTheDocument();
  });

  it("clears the loaded case and follow-up state when the reference number changes", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    await user.click(screen.getByRole("button", { name: "Confirm appointment" }));

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();

    const input = screen.getByRole("textbox", { name: "Case reference number" });
    await user.clear(input);
    await user.type(input, "JKL-234ABC");

    expect(screen.queryByText("Case found: ABC-DEF234")).not.toBeInTheDocument();
    expect(screen.queryByText("Booking panel for Homelessness")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(input).toHaveValue("JKL-234ABC");
  });

  it("disables the queue option when the case already has an active ticket", async () => {
    mockGetCaseFollowUp.mockResolvedValue(
      makeLookupResponse({
        hasActiveWaitingTicket: true,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(
      await screen.findByText(
        "This case is already in the queue, so you can only book an appointment right now.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join digital queue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeEnabled();
  });

  it("disables the booking option when the case has reached the appointment limit", async () => {
    mockGetCaseFollowUp.mockResolvedValue(
      makeLookupResponse({
        hasReachedAppointmentLimit: true,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(
      await screen.findByText(
        "This case already has two appointments booked online. Please contact us if you need another appointment.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join digital queue" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeDisabled();
  });

  it("shows the stricter warnings when the case is already queued and has reached the appointment limit", async () => {
    mockGetCaseFollowUp.mockResolvedValue(
      makeLookupResponse({
        hasActiveWaitingTicket: true,
        hasReachedAppointmentLimit: true,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);

    expect(
      await screen.findByText(
        "This case is already in the queue, so you cannot create another ticket right now.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This case already has two appointments booked online. Please contact us if you need another appointment.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Join digital queue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeDisabled();
  });

  it("requires a confirmed appointment before submit becomes available on the booking path", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Book appointment" }));

    expect(screen.getByText("Booking panel for Homelessness")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Confirm appointment" }));

    expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled();
  });

  it("shows an error when submit is attempted before choosing how to proceed", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    fireEvent.submit(screen.getByRole("button", { name: "Submit" }).closest("form")!);

    expect(await screen.findByText("Choose how you want to proceed.")).toBeInTheDocument();
    expect(mockSubmitCaseFollowUp).not.toHaveBeenCalled();
  });

  it("shows an error when submit is attempted before confirming an appointment", async () => {
    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Book appointment" }));

    fireEvent.submit(screen.getByRole("button", { name: "Submit" }).closest("form")!);

    expect(await screen.findByText("Choose an appointment date and time.")).toBeInTheDocument();
    expect(mockSubmitCaseFollowUp).not.toHaveBeenCalled();
  });

  it("submits a queue follow-up with the expected payload and auth mode", async () => {
    mockGetCaseFollowUp.mockResolvedValue(
      makeLookupResponse({
        departmentName: "Adults_Duty",
      }),
    );
    mockSubmitCaseFollowUp.mockResolvedValue(
      makeSubmitResponse({
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.type(screen.getByRole("textbox", { name: "Add new information (optional)" }), "  New information  ");
    await user.click(screen.getByRole("button", { name: "Join digital queue" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockSubmitCaseFollowUp).toHaveBeenCalledWith(
        {
          input: {
            referenceNumber: "ABC-DEF234",
            caseUpdate: "New information",
            proceed: "JOIN_DIGITAL_QUEUE",
            appointmentDateIso: undefined,
            appointmentTime: undefined,
          },
        },
        { authMode: "identityPool" },
      );
    });
  });

  it("navigates with a queue receipt after a successful queue follow-up", async () => {
    mockGetCaseFollowUp.mockResolvedValue(
      makeLookupResponse({
        departmentName: "Adults_Duty",
      }),
    );
    mockSubmitCaseFollowUp.mockResolvedValue(
      makeSubmitResponse({
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.type(screen.getByRole("textbox", { name: "Add new information (optional)" }), "  New information  ");
    await user.click(screen.getByRole("button", { name: "Join digital queue" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockNavigate).toHaveBeenCalledWith("/receipts/ABC-DEF234", {
      state: {
        receipt: {
          referenceNumber: "ABC-DEF234",
          bookingReferenceNumber: undefined,
          receiptType: "QUEUE",
          ticketNumber: "A12",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 20,
          appointmentDateIso: undefined,
          appointmentTime: undefined,
          departmentName: "Adults duty",
        },
      },
    });
  });

  it("submits a booked appointment follow-up with the expected payload and auth mode", async () => {
    mockSubmitCaseFollowUp.mockResolvedValue(
      makeSubmitResponse({
        bookingReferenceNumber: "APT-XYZ234",
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    await user.click(screen.getByRole("button", { name: "Confirm appointment" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockSubmitCaseFollowUp).toHaveBeenCalledWith(
        {
          input: {
            referenceNumber: "ABC-DEF234",
            caseUpdate: undefined,
            proceed: "BOOK_APPOINTMENT",
            appointmentDateIso: "2026-06-14",
            appointmentTime: "09:45",
          },
        },
        { authMode: "identityPool" },
      );
    });
  });

  it("navigates with an appointment receipt after a successful booked follow-up", async () => {
    mockSubmitCaseFollowUp.mockResolvedValue(
      makeSubmitResponse({
        bookingReferenceNumber: "APT-XYZ234",
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Book appointment" }));
    await user.click(screen.getByRole("button", { name: "Confirm appointment" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockNavigate).toHaveBeenCalledWith("/receipts/ABC-DEF234", {
      state: {
        receipt: {
          referenceNumber: "ABC-DEF234",
          bookingReferenceNumber: "APT-XYZ234",
          receiptType: "APPOINTMENT",
          ticketNumber: undefined,
          estimatedWaitTimeLower: undefined,
          estimatedWaitTimeUpper: undefined,
          appointmentDateIso: "2026-06-14",
          appointmentTime: "09:45",
          departmentName: "Homelessness",
        },
      },
    });
  });

  it("shows the submit error returned by the backend and does not navigate", async () => {
    mockSubmitCaseFollowUp.mockResolvedValue({
      data: {
        ok: false,
        errorMessage: "Unable to submit this update right now.",
      },
      errors: undefined,
    });

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Join digital queue" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByText("Unable to submit this update right now."),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the submit error and does not navigate", async () => {
    mockSubmitCaseFollowUp.mockResolvedValue({
      data: null,
      errors: [{ message: "Submission temporarily unavailable." }],
    });

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Join digital queue" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Submission temporarily unavailable.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows a generic error when submit throws and does not navigate", async () => {
    mockSubmitCaseFollowUp.mockRejectedValue(new Error("Network down"));

    renderPage();
    const user = userEvent.setup();

    await lookupCase(user);
    await screen.findByText("Case found: ABC-DEF234");

    await user.click(screen.getByRole("button", { name: "Join digital queue" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(await screen.findByText("Submission failed. Please try again.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

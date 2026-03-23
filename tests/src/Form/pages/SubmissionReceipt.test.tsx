import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  mockNavigate,
  mockGenerateClient,
  mockGetSubmissionReceipt,
  mockGetDataAuthMode,
  mockToDataURL,
  mockWriteText,
  testState,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockGenerateClient: vi.fn(),
  mockGetSubmissionReceipt: vi.fn(),
  mockGetDataAuthMode: vi.fn(),
  mockToDataURL: vi.fn(),
  mockWriteText: vi.fn(),
  testState: {
    referenceNumber: "abc-def234",
    locationState: null as { receipt?: ReceiptLike } | null,
  },
}));

type ReceiptLike = {
  createdAt?: string;
  referenceNumber: string;
  bookingReferenceNumber?: string;
  receiptType: "QUEUE" | "APPOINTMENT" | string;
  ticketNumber?: string;
  estimatedWaitTimeLower?: number;
  estimatedWaitTimeUpper?: number;
  appointmentDateIso?: string;
  appointmentTime?: string;
  departmentName?: string;
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: testState.locationState }),
    useParams: () => ({ referenceNumber: testState.referenceNumber }),
  };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

vi.mock("qrcode", () => ({
  toDataURL: mockToDataURL,
}));

vi.mock("../../../utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

vi.mock("../../../components/NavBar", () => ({
  default: () => <div>Navigation</div>,
}));

vi.mock("../../../components/SubmissionReceiptComponents/ReceiptHeaderCard", () => ({
  default: ({
    chipLabel,
    heading,
    caseReferenceNumber,
    appointmentReferenceNumber,
    onCopyCaseReference,
    onCopyAppointmentReference,
  }: {
    chipLabel: string;
    heading: string;
    caseReferenceNumber?: string;
    appointmentReferenceNumber?: string;
    onCopyCaseReference?: () => void;
    onCopyAppointmentReference?: () => void;
  }) => (
    <section>
      <div>Chip: {chipLabel}</div>
      <h1>{heading}</h1>
      <div>Case reference: {caseReferenceNumber ?? "-"}</div>
      <button type="button" onClick={onCopyCaseReference}>
        Copy case reference
      </button>
      {appointmentReferenceNumber ? (
        <>
          <div>Appointment reference: {appointmentReferenceNumber}</div>
          <button type="button" onClick={onCopyAppointmentReference}>
            Copy appointment reference
          </button>
        </>
      ) : null}
    </section>
  ),
}));

vi.mock("../../../components/SubmissionReceiptComponents/ReceiptBody", () => ({
  default: ({
    receipt,
    qrCodeUrl,
    onCopyTicket,
    onCheckQueueStatus,
    onCopyAppointmentDetails,
  }: {
    receipt: ReceiptLike;
    qrCodeUrl: string | null;
    onCopyTicket: () => void;
    onCheckQueueStatus: () => void;
    onCopyAppointmentDetails?: () => void;
  }) => (
    <section>
      <div>Receipt type: {receipt.receiptType}</div>
      {receipt.ticketNumber ? <div>Ticket number: {receipt.ticketNumber}</div> : null}
      <div>QR code: {qrCodeUrl ?? "none"}</div>
      <button type="button" onClick={onCopyTicket}>
        Copy ticket
      </button>
      <button type="button" onClick={onCheckQueueStatus}>
        Check queue status
      </button>
      {receipt.receiptType === "APPOINTMENT" ? (
        <button type="button" onClick={onCopyAppointmentDetails}>
          Copy appointment details
        </button>
      ) : null}
    </section>
  ),
}));

import SubmissionReceipt from "../../../pages/Form/SubmissionReceipt";

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, "clipboard");

function makeRouteReceipt(overrides: Partial<ReceiptLike> = {}): ReceiptLike {
  return {
    referenceNumber: " abc-def234 ",
    bookingReferenceNumber: " apt-xyz234 ",
    receiptType: "APPOINTMENT",
    appointmentDateIso: "2026-06-20",
    appointmentTime: "09:00",
    departmentName: "Homelessness",
    createdAt: "2026-06-15T10:00:00.000Z",
    ...overrides,
  };
}

function makeReceiptResponse(overrides: Record<string, unknown> = {}) {
  return {
    data: {
      found: true,
      referenceNumber: "ABC-DEF234",
      receiptType: "APPOINTMENT",
      bookingReferenceNumber: "APT-XYZ234",
      appointmentDateIso: "2026-06-20",
      appointmentTime: "09:00",
      departmentName: "Homelessness",
      createdAt: "2026-06-15T10:00:00.000Z",
      ...overrides,
    },
    errors: undefined,
  };
}

function renderPage(options?: {
  referenceNumber?: string;
  locationState?: { receipt?: ReceiptLike } | null;
}) {
  testState.referenceNumber = options?.referenceNumber ?? "abc-def234";
  testState.locationState = options?.locationState ?? null;

  return render(<SubmissionReceipt />);
}

function stubClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText,
    },
  });
}

describe("SubmissionReceipt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      queries: {
        getSubmissionReceipt: mockGetSubmissionReceipt,
      },
    });
    mockGetDataAuthMode.mockResolvedValue("identityPool");
    mockGetSubmissionReceipt.mockResolvedValue(makeReceiptResponse());
    mockToDataURL.mockResolvedValue("data:image/png;base64,qr-code");
    mockWriteText.mockResolvedValue(undefined);

    stubClipboard(mockWriteText);
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();

    if (originalClipboardDescriptor) {
      Object.defineProperty(window.navigator, "clipboard", originalClipboardDescriptor);
    } else {
      Reflect.deleteProperty(window.navigator, "clipboard");
    }
  });

  it("shows an error when no case reference number is provided", async () => {
    renderPage({
      referenceNumber: "   ",
    });

    expect(await screen.findByText("No case reference number was provided.")).toBeInTheDocument();
    expect(mockGetSubmissionReceipt).not.toHaveBeenCalled();
  });

  it("renders the matching route receipt", () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    expect(screen.getByText("Chip: Appointment confirmed")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appointment receipt" })).toBeInTheDocument();
    expect(screen.getByText("Case reference: ABC-DEF234")).toBeInTheDocument();
    expect(screen.getByText("Appointment reference: APT-XYZ234")).toBeInTheDocument();
    expect(screen.getByText("QR code: none")).toBeInTheDocument();
  });

  it("normalises the route receipt reference before requesting the latest receipt", async () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    await waitFor(() => {
      expect(mockGetSubmissionReceipt).toHaveBeenCalledWith(
        { referenceNumber: "ABC-DEF234" },
        { authMode: "identityPool" },
      );
    });
  });

  it("builds an appointment QR code from the booking reference", async () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    await waitFor(() => {
      expect(mockToDataURL).toHaveBeenCalledWith(
        "APPOINTMENT|APT-XYZ234",
        expect.objectContaining({
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
        }),
      );
    });
  });

  it("ignores a mismatched route receipt and loads the backend receipt instead", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        receiptType: "QUEUE",
        bookingReferenceNumber: undefined,
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
        appointmentDateIso: undefined,
        appointmentTime: undefined,
      }),
    );

    renderPage({
      locationState: {
        receipt: makeRouteReceipt({
          referenceNumber: "ZZZ-123456",
        }),
      },
    });

    expect(await screen.findByText("Chip: Queue receipt")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ticket receipt" })).toBeInTheDocument();
    expect(screen.getByText("Case reference: ABC-DEF234")).toBeInTheDocument();
    expect(screen.getByText("Ticket number: A12")).toBeInTheDocument();
    expect(screen.queryByText(/Appointment reference:/)).not.toBeInTheDocument();
  });

  it("builds a queue QR code for a loaded queue receipt", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        receiptType: "QUEUE",
        bookingReferenceNumber: undefined,
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
        appointmentDateIso: undefined,
        appointmentTime: undefined,
      }),
    );

    renderPage({
      locationState: {
        receipt: makeRouteReceipt({
          referenceNumber: "ZZZ-123456",
        }),
      },
    });

    await waitFor(() => {
      expect(mockToDataURL).toHaveBeenCalledWith(
        "QUEUE|A12",
        expect.objectContaining({
          width: 280,
        }),
      );
    });
  });

  it("uses matching route receipt values when the backend omits appointment details", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        createdAt: "2026-06-16T11:15:00.000Z",
        bookingReferenceNumber: "",
        appointmentDateIso: "",
        appointmentTime: "",
        departmentName: "",
      }),
    );

    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    expect(await screen.findByText("Appointment reference: APT-XYZ234")).toBeInTheDocument();
  });

  it("builds a QR code after merging matching route receipt values", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        createdAt: "2026-06-16T11:15:00.000Z",
        bookingReferenceNumber: "",
        appointmentDateIso: "",
        appointmentTime: "",
        departmentName: "",
      }),
    );

    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    expect(
      await screen.findByText("QR code: data:image/png;base64,qr-code"),
    ).toBeInTheDocument();
  });

  it("keeps the route receipt visible when loading the latest receipt returns errors", async () => {
    mockGetSubmissionReceipt.mockResolvedValue({
      data: null,
      errors: [{ message: "Temporary error." }],
    });

    renderPage({
      locationState: {
        receipt: makeRouteReceipt({
          receiptType: "QUEUE",
          bookingReferenceNumber: undefined,
          ticketNumber: "Q42",
          appointmentDateIso: undefined,
          appointmentTime: undefined,
        }),
      },
    });

    expect(await screen.findByText("Chip: Queue receipt")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ticket receipt" })).toBeInTheDocument();
    expect(screen.getByText("Ticket number: Q42")).toBeInTheDocument();
    expect(screen.queryByText("Temporary error.")).not.toBeInTheDocument();
  });

  it("shows a permission error when the backend returns an unauthorized response", async () => {
    mockGetSubmissionReceipt.mockResolvedValue({
      data: null,
      errors: [{ message: "Unauthorized to view this receipt." }],
    });

    renderPage();

    expect(
      await screen.findByText("You do not have permission to view that receipt right now."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Receipt type:/)).not.toBeInTheDocument();
  });

  it("shows the backend not-found message when no receipt can be found", async () => {
    mockGetSubmissionReceipt.mockResolvedValue({
      data: {
        found: false,
        errorMessage: "We could not find that receipt.",
      },
      errors: undefined,
    });

    renderPage();

    expect(await screen.findByText("We could not find that receipt.")).toBeInTheDocument();
    expect(screen.queryByText(/Receipt type:/)).not.toBeInTheDocument();
  });

  it("copies the case reference number from an appointment receipt", async () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copy case reference" }));

    expect(await screen.findByText("Case reference number copied")).toBeInTheDocument();
  });

  it("copies the appointment reference number from an appointment receipt", async () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copy appointment reference" }));

    expect(
      await screen.findByText("Appointment reference number copied"),
    ).toBeInTheDocument();
  });

  it("copies the appointment details from an appointment receipt", async () => {
    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Copy appointment details" }));

    expect(await screen.findByText("Appointment details copied")).toBeInTheDocument();
  });

  it("does nothing when appointment details are missing", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        bookingReferenceNumber: undefined,
        appointmentDateIso: undefined,
        appointmentTime: undefined,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Receipt type: APPOINTMENT");
    await user.click(screen.getByRole("button", { name: "Copy appointment details" }));

    expect(screen.queryByText("Appointment details copied")).not.toBeInTheDocument();
    expect(screen.queryByText("Could not copy. Please write it down.")).not.toBeInTheDocument();
  });

  it("copies the ticket number from a queue receipt", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        receiptType: "QUEUE",
        bookingReferenceNumber: undefined,
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
        appointmentDateIso: undefined,
        appointmentTime: undefined,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Ticket number: A12");

    await user.click(screen.getByRole("button", { name: "Copy ticket" }));
    expect(await screen.findByText("Ticket number copied")).toBeInTheDocument();
  });

  it("shows a copy error when clipboard writing fails", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("Denied")));

    renderPage({
      locationState: {
        receipt: makeRouteReceipt(),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Copy case reference" }));

    expect(await screen.findByText("Could not copy. Please write it down.")).toBeInTheDocument();
  });

  it("navigates to the queue status page from a queue receipt", async () => {
    mockGetSubmissionReceipt.mockResolvedValue(
      makeReceiptResponse({
        receiptType: "QUEUE",
        bookingReferenceNumber: undefined,
        ticketNumber: "A12",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
        appointmentDateIso: undefined,
        appointmentTime: undefined,
      }),
    );

    renderPage();
    const user = userEvent.setup();

    await screen.findByText("Ticket number: A12");

    await user.click(screen.getByRole("button", { name: "Check queue status" }));
    expect(mockNavigate).toHaveBeenCalledWith("/referencepage");
  });

  it("shows a generic error when loading the receipt throws", async () => {
    mockGetSubmissionReceipt.mockRejectedValue(new Error("Network down"));

    renderPage();

    expect(
      await screen.findByText("We could not load that receipt right now."),
    ).toBeInTheDocument();
  });
});

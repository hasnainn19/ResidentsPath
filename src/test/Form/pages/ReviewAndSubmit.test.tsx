import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { FormData } from "../../../pages/Form/model/formFieldTypes";

const {
  mockNavigate,
  mockSetFormData,
  mockHandleSave,
  mockClearSavedDraft,
  mockGenerateClient,
  mockSubmitEnquiry,
  mockGetDataAuthMode,
  mockGetEnquirySelectionState,
  mockGetReviewDisplayValue,
  mockGetReviewLabel,
  mockBuildSubmitEnquiryPayload,
  testState,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetFormData: vi.fn(),
  mockHandleSave: vi.fn(),
  mockClearSavedDraft: vi.fn(),
  mockGenerateClient: vi.fn(),
  mockSubmitEnquiry: vi.fn(),
  mockGetDataAuthMode: vi.fn(),
  mockGetEnquirySelectionState: vi.fn(),
  mockGetReviewDisplayValue: vi.fn(),
  mockGetReviewLabel: vi.fn(),
  mockBuildSubmitEnquiryPayload: vi.fn(),
  testState: {
    formData: null as FormData | null,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

vi.mock("../../../utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

vi.mock("../../../context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
    handleSave: mockHandleSave,
    clearSavedDraft: mockClearSavedDraft,
  }),
}));

vi.mock("../../../components/FormPageComponents/FormStepLayout", () => ({
  default: ({
    title,
    subtitle,
    children,
    onBack,
  }: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    onBack?: () => void;
  }) => (
    <section>
      <button type="button" onClick={onBack}>
        Back
      </button>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../components/FormPageComponents/PrivacyNoticeDialog", () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div>
        <div>Privacy notice dialog</div>
        <button type="button" onClick={onClose}>
          Close privacy notice
        </button>
      </div>
    ) : null,
}));

vi.mock("../../../components/FormPageComponents/WithTTS", () => ({
  default: ({ children, copy }: { children: ReactNode; copy: { label?: string } }) => (
    <section>
      {copy.label ? <h2>{copy.label}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../components/FormPageComponents/StepActions", () => ({
  default: ({
    onSave,
    showPrevious,
    onPrevious,
    advanceLabel,
    advanceDisabled,
    advanceType = "submit",
    onAdvanceClick,
  }: {
    onSave: () => void;
    showPrevious?: boolean;
    onPrevious?: () => void;
    advanceLabel: string;
    advanceDisabled?: boolean;
    advanceType?: "button" | "submit";
    onAdvanceClick?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onSave}>
        Save and continue later
      </button>
      {showPrevious ? (
        <button type="button" onClick={onPrevious}>
          Previous
        </button>
      ) : null}
      <button type={advanceType} disabled={advanceDisabled} onClick={onAdvanceClick}>
        {advanceLabel}
      </button>
    </div>
  ),
}));

vi.mock("../../../pages/Form/model/getEnquirySelectionState", () => ({
  getEnquirySelectionState: mockGetEnquirySelectionState,
}));

vi.mock("../../../pages/Form/model/fieldMeta", () => ({
  getReviewDisplayValue: mockGetReviewDisplayValue,
  getReviewLabel: mockGetReviewLabel,
}));

vi.mock("../../../pages/Form/model/buildSubmitEnquiryPayload", () => ({
  buildSubmitEnquiryPayload: mockBuildSubmitEnquiryPayload,
}));

import ReviewAndSubmit from "../../../pages/Form/ReviewAndSubmit";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    language: "en",
    privacyNoticeAccepted: false,
    provideDetails: "yes",
    firstName: "",
    middleName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phoneCountry: "GB",
    phone: "",
    dob: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    townOrCity: "",
    postcode: "",
    pronouns: "",
    pronounsOtherText: "",
    topLevel: "",
    generalServicesChoice: "",
    enquiryId: "",
    specificDetailId: "",
    routedDepartment: "",
    hasChildren: false,
    childrenCount: "",
    hasDisabilityOrSensory: false,
    disabilityType: "",
    householdSize: "",
    domesticAbuse: false,
    safeToContact: "PREFER_NOT_TO_SAY",
    safeContactNotes: "",
    ageRange: "",
    urgent: "unsure",
    urgentReason: "",
    urgentReasonOtherText: "",
    additionalInfo: "",
    proceed: "",
    needsAccessibility: false,
    needsLanguage: false,
    needsSeating: false,
    needsWrittenUpdates: false,
    needsLargeText: false,
    needsQuietSpace: false,
    needsBSL: false,
    needsHelpWithForms: false,
    supportNotes: "",
    otherSupport: "",
    contactMethod: "",
    appointmentDateIso: "",
    appointmentTime: "",
    ...overrides,
  };
}

function makeSelectionState(overrides: Record<string, unknown> = {}) {
  return {
    selectedEnquiry: null,
    ...overrides,
  };
}

function renderPage(options?: {
  formData?: Partial<FormData>;
  selectionState?: Record<string, unknown>;
}) {
  testState.formData = makeFormData(options?.formData);
  mockGetEnquirySelectionState.mockReturnValue(makeSelectionState(options?.selectionState));

  return render(<ReviewAndSubmit />);
}

describe("ReviewAndSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      mutations: {
        submitEnquiry: mockSubmitEnquiry,
      },
    });
    mockGetDataAuthMode.mockResolvedValue("identityPool");
    mockGetReviewLabel.mockImplementation((key: keyof FormData) => String(key));
    mockGetReviewDisplayValue.mockReturnValue(null);
    mockBuildSubmitEnquiryPayload.mockReturnValue({
      departmentName: "Homelessness",
      enquiry: "homelessness",
      proceed: "BOOK_APPOINTMENT",
    });
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: true,
        referenceNumber: "CASE-12345",
      },
      errors: undefined,
    });
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  it("shows only populated review sections", () => {
    mockGetReviewDisplayValue.mockImplementation((key: keyof FormData) => {
      if (key === "firstName") return "Test";
      if (key === "enquiryId") return "Homelessness";
      if (key === "appointmentDateIso") return "12 May 2026";
      return null;
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });

    expect(screen.getByRole("heading", { name: "Your details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your request" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Appointment" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Urgency" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Support needs" })).not.toBeInTheDocument();
  });

  it("routes section edit actions to the matching step", async () => {
    mockGetReviewDisplayValue.mockImplementation((key: keyof FormData) => {
      if (key === "firstName") return "Test";
      if (key === "enquiryId") return "Homelessness";
      if (key === "appointmentDateIso") return "12 May 2026";
      return null;
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    const requestSection = screen.getByRole("heading", { name: "Your request" }).closest("section");
    const appointmentSection = screen
      .getByRole("heading", { name: "Appointment" })
      .closest("section");

    expect(requestSection).not.toBeNull();
    expect(appointmentSection).not.toBeNull();

    await user.click(within(requestSection as HTMLElement).getByRole("button", { name: "Edit" }));
    await user.click(
      within(appointmentSection as HTMLElement).getByRole("button", { name: "Edit" }),
    );

    expect(mockNavigate).toHaveBeenNthCalledWith(1, "/form/enquiry-selection");
    expect(mockNavigate).toHaveBeenNthCalledWith(2, "/form/actions");
  });

  it("keeps submit disabled until the privacy notice has been acknowledged", () => {
    renderPage({
      formData: {
        privacyNoticeAccepted: false,
      },
    });

    expect(screen.getByRole("button", { name: "Submit request" })).toBeDisabled();
  });

  it("opens and closes the privacy notice dialog", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Read the full privacy notice" }));

    expect(screen.getByText("Privacy notice dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close privacy notice" }));

    expect(screen.queryByText("Privacy notice dialog")).not.toBeInTheDocument();
  });

  it("submits successfully, clears the draft, and navigates with an appointment receipt", async () => {
    mockBuildSubmitEnquiryPayload.mockReturnValue({
      departmentName: "Homelessness",
      enquiry: "homelessness",
      proceed: "BOOK_APPOINTMENT",
    });
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: true,
        referenceNumber: "CASE-12345",
        bookingReferenceNumber: "BOOK-222",
        ticketNumber: "Q-19",
        estimatedWaitTimeLower: 10,
        estimatedWaitTimeUpper: 20,
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2026-05-12",
        appointmentTime: "11:30",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(mockSubmitEnquiry).toHaveBeenCalledWith(
        {
          input: {
            departmentName: "Homelessness",
            enquiry: "homelessness",
            proceed: "BOOK_APPOINTMENT",
          },
        },
        { authMode: "identityPool" },
      );
    });

    expect(mockBuildSubmitEnquiryPayload).toHaveBeenCalledWith(
      expect.objectContaining({
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2026-05-12",
        appointmentTime: "11:30",
      }),
    );
    expect(mockClearSavedDraft).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/receipts/CASE-12345", {
      state: {
        receipt: {
          referenceNumber: "CASE-12345",
          bookingReferenceNumber: "BOOK-222",
          receiptType: "APPOINTMENT",
          ticketNumber: "Q-19",
          estimatedWaitTimeLower: 10,
          estimatedWaitTimeUpper: 20,
          appointmentDateIso: "2026-05-12",
          appointmentTime: "11:30",
          departmentName: "Homelessness",
        },
      },
    });
  });

  it("submits successfully and navigates with a queue receipt", async () => {
    mockBuildSubmitEnquiryPayload.mockReturnValue({
      departmentName: "General_Customer_Services",
      enquiry: "general_services",
      proceed: "JOIN_DIGITAL_QUEUE",
    });
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: true,
        referenceNumber: "CASE-QUEUE",
        ticketNumber: "A12",
        estimatedWaitTimeLower: 5,
        estimatedWaitTimeUpper: 15,
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
        proceed: "JOIN_DIGITAL_QUEUE",
        appointmentDateIso: "",
        appointmentTime: "",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/receipts/CASE-QUEUE", {
        state: {
          receipt: {
            referenceNumber: "CASE-QUEUE",
            bookingReferenceNumber: undefined,
            receiptType: "QUEUE",
            ticketNumber: "A12",
            estimatedWaitTimeLower: 5,
            estimatedWaitTimeUpper: 15,
            appointmentDateIso: undefined,
            appointmentTime: undefined,
            departmentName: "General customer services",
          },
        },
      });
    });
  });

  it("does not submit again while a submission is already in progress", async () => {
    let resolveSubmit:
      | ((value: {
          data: {
            ok: true;
            referenceNumber: string;
          };
          errors: undefined;
        }) => void)
      | undefined;

    mockSubmitEnquiry.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();
    const submitButton = screen.getByRole("button", { name: "Submit request" });

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitEnquiry).toHaveBeenCalledTimes(1);
      expect(submitButton).toBeDisabled();
    });

    await user.click(submitButton);

    expect(mockSubmitEnquiry).toHaveBeenCalledTimes(1);

    resolveSubmit?.({
      data: {
        ok: true,
        referenceNumber: "CASE-12345",
      },
      errors: undefined,
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/receipts/CASE-12345", expect.any(Object));
    });
  });

  it("shows a generic error when the mutation returns GraphQL errors", async () => {
    mockSubmitEnquiry.mockResolvedValue({
      data: null,
      errors: [{ message: "Something went wrong" }],
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("Submission failed. Please try again.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockClearSavedDraft).not.toHaveBeenCalled();
  });

  it("shows the backend error message when the submission is rejected by the handler", async () => {
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: false,
        errorMessage: "Unable to submit right now.",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("Unable to submit right now.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows the generic error when the handler rejects without an error message", async () => {
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: false,
        errorMessage: "",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("Submission failed. Please try again.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows a specific error when submission succeeds without a case reference", async () => {
    mockSubmitEnquiry.mockResolvedValue({
      data: {
        ok: true,
        referenceNumber: "",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(
      await screen.findByText("Submission succeeded but no case reference number was returned."),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows a generic error when submission throws", async () => {
    mockSubmitEnquiry.mockRejectedValue(new Error("Network down"));

    renderPage({
      formData: {
        privacyNoticeAccepted: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Submit request" }));

    expect(await screen.findByText("Submission failed. Please try again.")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

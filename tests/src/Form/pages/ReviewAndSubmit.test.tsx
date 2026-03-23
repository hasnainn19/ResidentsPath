import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";

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
    latestAdvanceClick: null as null | (() => void | Promise<void>),
  },
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

vi.mock("../../../../src/context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
    handleSave: mockHandleSave,
    clearSavedDraft: mockClearSavedDraft,
  }),
}));

vi.mock("../../../../src/components/FormPageComponents/FormStepLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/components/FormPageComponents/PrivacyNoticeDialog", () => ({
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

vi.mock("../../../../src/components/FormPageComponents/WithTTS", () => ({
  default: ({ children, copy }: { children: ReactNode; copy: { label?: string } }) => (
    <section>
      {copy.label ? <h2>{copy.label}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../../src/components/FormPageComponents/StepActions", () => ({
  default: ({
    advanceLabel,
    advanceDisabled,
    advanceType = "submit",
    onAdvanceClick,
  }: {
    advanceLabel: string;
    advanceDisabled?: boolean;
    advanceType?: "button" | "submit";
    onAdvanceClick?: () => void;
  }) => {
    testState.latestAdvanceClick = onAdvanceClick ?? null;

    return (
      <div>
        <button type={advanceType} disabled={advanceDisabled} onClick={onAdvanceClick}>
          {advanceLabel}
        </button>
      </div>
    );
  },
}));

vi.mock("../../../../src/pages/Form/model/getEnquirySelectionState", () => ({
  getEnquirySelectionState: mockGetEnquirySelectionState,
}));

vi.mock("../../../../src/pages/Form/model/fieldMeta", () => ({
  getReviewDisplayValue: mockGetReviewDisplayValue,
  getReviewLabel: mockGetReviewLabel,
}));

vi.mock("../../../../src/pages/Form/model/buildSubmitEnquiryPayload", () => ({
  buildSubmitEnquiryPayload: mockBuildSubmitEnquiryPayload,
}));

import ReviewAndSubmit from "../../../../src/pages/Form/ReviewAndSubmit";

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

  it("routes the request section edit action to enquiry selection", async () => {
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
    expect(requestSection).not.toBeNull();

    await user.click(within(requestSection as HTMLElement).getByRole("button", { name: "Edit" }));

    expect(mockNavigate).toHaveBeenCalledWith("/form/enquiry-selection");
  });

  it("routes the appointment section edit action to actions", async () => {
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

    const appointmentSection = screen
      .getByRole("heading", { name: "Appointment" })
      .closest("section");

    expect(appointmentSection).not.toBeNull();

    await user.click(
      within(appointmentSection as HTMLElement).getByRole("button", { name: "Edit" }),
    );

    expect(mockNavigate).toHaveBeenCalledWith("/form/actions");
  });

  it("keeps submit disabled until the privacy notice has been acknowledged", () => {
    renderPage({
      formData: {
        privacyNoticeAccepted: false,
      },
    });

    expect(screen.getByRole("button", { name: "Submit request" })).toBeDisabled();
  });

  it("updates privacy notice acceptance when the acknowledgement checkbox is changed", async () => {
    mockSetFormData.mockImplementation((updater: FormData | ((prev: FormData) => FormData)) => {
      testState.formData =
        typeof updater === "function" ? updater(testState.formData as FormData) : updater;
    });

    renderPage();
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("checkbox", {
        name: "I acknowledge the privacy notice for this form.",
      }),
    );

    expect(mockSetFormData).toHaveBeenCalledTimes(1);
    expect(testState.formData?.privacyNoticeAccepted).toBe(true);
  });

  it("opens and closes the privacy notice dialog", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Read the full privacy notice" }));
    expect(screen.getByText("Privacy notice dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close privacy notice" }));

    expect(screen.queryByText("Privacy notice dialog")).not.toBeInTheDocument();
  });

  it("submits an appointment request with the built payload and auth mode", async () => {
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
  });

  it("clears the saved draft after a successful appointment submission", async () => {
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
      expect(mockClearSavedDraft).toHaveBeenCalled();
    });
  });

  it("navigates with an appointment receipt after a successful appointment submission", async () => {
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
  });

  it("submits a queue request with the built payload and auth mode", async () => {
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
      expect(mockSubmitEnquiry).toHaveBeenCalledWith(
        {
          input: {
            departmentName: "General_Customer_Services",
            enquiry: "general_services",
            proceed: "JOIN_DIGITAL_QUEUE",
          },
        },
        { authMode: "identityPool" },
      );
    });
  });

  it("navigates with a queue receipt after a successful queue submission", async () => {
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

    await act(async () => {
      await testState.latestAdvanceClick?.();
    });

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

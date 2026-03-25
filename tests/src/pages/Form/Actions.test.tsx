import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";

const {
  mockNavigate,
  mockSetFormData,
  mockHandleSave,
  mockGenerateClient,
  mockGetDepartmentQueueStatus,
  mockGetDataAuthMode,
  mockGetEnquirySelectionState,
  testState,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetFormData: vi.fn(),
  mockHandleSave: vi.fn(),
  mockGenerateClient: vi.fn(),
  mockGetDepartmentQueueStatus: vi.fn(),
  mockGetDataAuthMode: vi.fn(),
  mockGetEnquirySelectionState: vi.fn(),
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

vi.mock("../../../../src/utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

vi.mock("../../../../src/context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
    handleSave: mockHandleSave,
  }),
}));

vi.mock("../../../../src/components/FormPageComponents/FormStepLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/components/FormPageComponents/WithTTS", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("../../../../src/components/FormPageComponents/StepActions", () => ({
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
      <button type="button" onClick={() => onConfirm("2026-05-12", "11:30")}>
        Confirm appointment
      </button>
    </div>
  ),
}));

vi.mock("../../../../src/pages/Form/model/getEnquirySelectionState", () => ({
  getEnquirySelectionState: mockGetEnquirySelectionState,
}));

import Actions from "../../../../src/pages/Form/Actions";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    language: "en",
    privacyNoticeAccepted: false,
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
  theme?: ReturnType<typeof createTheme>;
}) {
  testState.formData = makeFormData(options?.formData);
  mockGetEnquirySelectionState.mockReturnValue(makeSelectionState(options?.selectionState));

  const page = <Actions />;

  if (options?.theme) {
    return render(<ThemeProvider theme={options.theme}>{page}</ThemeProvider>);
  }

  return render(page);
}

describe("Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      queries: {
        getDepartmentQueueStatus: mockGetDepartmentQueueStatus,
      },
    });
    mockGetDataAuthMode.mockResolvedValue("identityPool");
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: {
        queueCount: 10,
        updatedAtIso: "2026-04-01T09:30:00.000Z",
      },
      errors: undefined,
    });
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  it("loads and displays queue information using the selected enquiry department", async () => {
    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
      },
      selectionState: {
        selectedEnquiry: {
          department: "Homelessness",
        },
      },
    });

    await waitFor(() => {
      expect(mockGetDepartmentQueueStatus).toHaveBeenCalledWith(
        { departmentName: "Homelessness" },
        { authMode: "identityPool" },
      );
    });

    expect(
      await screen.findByText("There are currently 10 people in this queue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Current queue level: Busy.")).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(screen.getByText("Join the digital queue")).toBeInTheDocument();
  });

  it("uses the routed department in preference to the selected enquiry department", async () => {
    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Adults_Duty",
      },
      selectionState: {
        selectedEnquiry: {
          department: "Homelessness",
        },
      },
    });

    await waitFor(() => {
      expect(mockGetDepartmentQueueStatus).toHaveBeenCalledWith(
        { departmentName: "Adults_Duty" },
        { authMode: "identityPool" },
      );
    });
  });

  it("shows a loading message while queue information is being requested", async () => {
    mockGetDataAuthMode.mockReturnValue(new Promise(() => {}));

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(
      await screen.findByText("Loading the current queue information..."),
    ).toBeInTheDocument();
  });

  it("falls back to zero people, the current time, and the theme main colour when queue details are incomplete", async () => {
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: {
        queueCount: undefined,
        updatedAtIso: "",
      },
      errors: undefined,
    });

    const theme = createTheme({
      palette: {
        success: {
          main: "#defbd3",
          dark: "",
        },
      },
    });

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
      theme,
    });

    expect(await screen.findByText("There is currently nobody in this queue.")).toBeInTheDocument();
    expect(screen.getByText("Current queue level: Quiet.")).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it("clamps negative queue counts to zero and shows the quiet queue message", async () => {
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: {
        queueCount: -4,
        updatedAtIso: "2026-04-01T09:30:00.000Z",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(await screen.findByText("There is currently nobody in this queue.")).toBeInTheDocument();
    expect(screen.getByText("Current queue level: Quiet.")).toBeInTheDocument();
  });

  it("shows the singular queue message for one person", async () => {
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: {
        queueCount: 1,
        updatedAtIso: "2026-04-01T09:30:00.000Z",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(await screen.findByText("There is currently 1 person in this queue.")).toBeInTheDocument();
  });

  it.each([
    { queueCount: 4, label: "Average" },
    { queueCount: 16, label: "Very busy" },
  ])("shows the $label queue label for a queue count of $queueCount", async ({ queueCount, label }) => {
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: {
        queueCount,
        updatedAtIso: "2026-04-01T09:30:00.000Z",
      },
      errors: undefined,
    });

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(await screen.findByText(`Current queue level: ${label}.`)).toBeInTheDocument();
  });

  it("shows an information message when queue details are unavailable for the selected service", () => {
    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
      },
    });

    expect(screen.getByText("Select a service to see the current queue size.")).toBeInTheDocument();
    expect(mockGetDepartmentQueueStatus).not.toHaveBeenCalled();
  });

  it("shows a warning when queue information cannot be loaded", async () => {
    mockGetDepartmentQueueStatus.mockResolvedValue({
      data: null,
      errors: [{ message: "fail" }],
    });

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(
      await screen.findByText("Unable to load the current queue size right now."),
    ).toBeInTheDocument();
  });

  it("shows a warning when loading queue information throws", async () => {
    mockGetDepartmentQueueStatus.mockRejectedValue(new Error("Network down"));

    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });

    expect(
      await screen.findByText("Unable to load the current queue size right now."),
    ).toBeInTheDocument();
  });

  it("renders the booking panel and disables continue until an appointment is selected", () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        routedDepartment: "Homelessness",
        appointmentDateIso: "",
        appointmentTime: "",
      },
    });

    expect(screen.getByText("Booking panel for Homelessness")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("stores the confirmed appointment details from the booking panel", async () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        routedDepartment: "Homelessness",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Confirm appointment" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      proceed: "BOOK_APPOINTMENT",
      routedDepartment: "Homelessness",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      appointmentDateIso: "2026-05-12",
      appointmentTime: "11:30",
    });
  });

  it("navigates to review and submit when continue is pressed on the queue path", async () => {
    renderPage({
      formData: {
        proceed: "JOIN_DIGITAL_QUEUE",
        routedDepartment: "Homelessness",
      },
    });
    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockGetDepartmentQueueStatus).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(mockNavigate).toHaveBeenCalledWith("/form/review-and-submit");
  });

  it("enables continue on the booking path once an appointment has been selected", () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        routedDepartment: "Homelessness",
        appointmentDateIso: "2026-05-12",
        appointmentTime: "11:30",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("calls handleSave from the page actions", async () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2026-05-12",
        appointmentTime: "11:30",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Save and continue later" }));

    expect(mockHandleSave).toHaveBeenCalled();
  });

  it("navigates back to personal details from the page actions", async () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2026-05-12",
        appointmentTime: "11:30",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Previous" }));

    expect(mockNavigate).toHaveBeenCalledWith("/form/personal-details");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { FormData } from "../../../pages/Form/model/formFieldTypes";

const {
  mockNavigate,
  mockSetFormData,
  mockHandleSave,
  mockComputeCanGoNext,
  mockApplyTopLevelChange,
  mockShouldShowSupportNotes,
  mockGetEnquirySelectionState,
  testState,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetFormData: vi.fn(),
  mockHandleSave: vi.fn(),
  mockComputeCanGoNext: vi.fn(),
  mockApplyTopLevelChange: vi.fn(),
  mockShouldShowSupportNotes: vi.fn(),
  mockGetEnquirySelectionState: vi.fn(),
  testState: {
    formData: null as FormData | null,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
    handleSave: mockHandleSave,
  }),
}));

vi.mock("../../../components/FormPageComponents/FormStepLayout", () => ({
  default: ({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children: ReactNode;
  }) => (
    <section>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../components/FormPageComponents/FormPrivacyNotice", () => ({
  default: () => <div>Privacy notice</div>,
}));

vi.mock("../../../components/FormPageComponents/WithTTS", () => ({
  default: ({
    children,
    copy,
  }: {
    children: ReactNode;
    copy: { label?: string };
  }) => (
    <section>
      {copy.label ? <h2>{copy.label}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../components/FormPageComponents/LeftCheckRow", () => ({
  default: ({
    label,
    checked,
    onChange,
    children,
  }: {
    label: string;
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    children?: ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onChange?.(!checked)}>
        {label}
      </button>
      {children}
    </div>
  ),
}));

vi.mock("../../../components/FormPageComponents/LongTextSection", () => ({
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

vi.mock("../../../components/FormPageComponents/StepActions", () => ({
  default: ({
    onSave,
    advanceLabel,
    advanceDisabled,
    advanceType = "submit",
  }: {
    onSave: () => void;
    advanceLabel: string;
    advanceDisabled?: boolean;
    advanceType?: "button" | "submit";
  }) => (
    <div>
      <button type="button" onClick={onSave}>
        Save and continue later
      </button>
      <button type={advanceType} disabled={advanceDisabled}>
        {advanceLabel}
      </button>
    </div>
  ),
}));

vi.mock("../../../pages/Form/model/enquirySelectionLogic", async () => {
  const actual = await vi.importActual<typeof import("../../../pages/Form/model/enquirySelectionLogic")>(
    "../../../pages/Form/model/enquirySelectionLogic",
  );

  return {
    ...actual,
    computeCanGoNext: mockComputeCanGoNext,
    applyTopLevelChange: mockApplyTopLevelChange,
    shouldShowSupportNotes: mockShouldShowSupportNotes,
  };
});

vi.mock("../../../pages/Form/model/getEnquirySelectionState", () => ({
  getEnquirySelectionState: mockGetEnquirySelectionState,
}));

import EnquirySelection from "../../../pages/Form/EnquirySelection";

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
    enquiryOptions: [],
    specificOptions: [],
    showSpecificDropdown: false,
    hasChosenEnquiry: false,
    hasEnoughToProceed: false,
    showChildrenQs: false,
    showDisabilityQs: false,
    showHouseholdSize: false,
    showDomesticAbuseQs: false,
    showAgeRange: false,
    ...overrides,
  };
}

function renderPage(options?: {
  formData?: Partial<FormData>;
  selectionState?: Record<string, unknown>;
  canGoNext?: boolean;
  showSupportNotes?: boolean;
}) {
  testState.formData = makeFormData(options?.formData);
  mockGetEnquirySelectionState.mockReturnValue(makeSelectionState(options?.selectionState));
  mockComputeCanGoNext.mockReturnValue(options?.canGoNext ?? false);
  mockShouldShowSupportNotes.mockReturnValue(options?.showSupportNotes ?? false);

  return render(<EnquirySelection />);
}

describe("EnquirySelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApplyTopLevelChange.mockImplementation((prev: FormData, nextTopLevel: string) => ({
      ...prev,
      topLevel: nextTopLevel,
    }));
  });

  it("renders the page title and main service area field", () => {
    renderPage();

    expect(screen.getByText("Council service request")).toBeInTheDocument();
    expect(screen.getByText("What do you need help with?")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select an area..." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows the enquiry and more detail dropdowns when the current selection needs them", () => {
    renderPage({
      formData: { topLevel: "Housing", enquiryId: "homelessness" },
      selectionState: {
        enquiryOptions: [
          { value: "housing_benefit", label: "Housing Benefit" },
          { value: "homelessness", label: "Homelessness" },
        ],
        specificOptions: [{ value: "temp_accommodation", label: "Temporary accommodation" }],
        hasChosenEnquiry: true,
        showSpecificDropdown: true,
      },
    });

    expect(screen.getByRole("combobox", { name: "Select an enquiry..." })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select a detail..." })).toBeInTheDocument();
  });

  it("does not show the enquiry dropdown when the selected area has only one enquiry", () => {
    renderPage({
      formData: { topLevel: "CouncilTax", enquiryId: "council_tax" },
      selectionState: {
        enquiryOptions: [{ value: "council_tax", label: "Council Tax" }],
        hasChosenEnquiry: true,
      },
    });

    expect(screen.queryByRole("combobox", { name: "Select an enquiry..." })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Select a detail..." })).not.toBeInTheDocument();
  });

  it("calls setFormData with the top-level updater when the area changes", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select an area..." }));
    await user.click(await screen.findByRole("option", { name: "Council Tax" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData();

    expect(updater(previousState)).toEqual(
      expect.objectContaining({
        topLevel: "CouncilTax",
      }),
    );
    expect(mockApplyTopLevelChange).toHaveBeenCalledWith(previousState, "CouncilTax");
  });

  it("calls setFormData when the selected enquiry changes", async () => {
    renderPage({
      formData: {
        topLevel: "Housing",
        enquiryId: "housing_benefit",
      },
      selectionState: {
        enquiryOptions: [
          { value: "housing_benefit", label: "Housing Benefit", department: "Benefits" },
          { value: "homelessness", label: "Homelessness", department: "Homelessness" },
        ],
        hasChosenEnquiry: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select an enquiry..." }));
    await user.click(await screen.findByRole("option", { name: "Homelessness" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      topLevel: "Housing",
      enquiryId: "housing_benefit",
    });

    expect(updater(previousState)).toEqual(
      expect.objectContaining({
        enquiryId: "homelessness",
        routedDepartment: "Homelessness",
      }),
    );
  });

  it("clears childrenCount when dependent children is unchecked", async () => {
    renderPage({
      formData: {
        hasChildren: true,
        childrenCount: "2",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showChildrenQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "I have dependent children" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      hasChildren: true,
      childrenCount: "2",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      hasChildren: false,
      childrenCount: "",
    });
  });

  it("clears disabilityType when disability support is unchecked", async () => {
    renderPage({
      formData: {
        hasDisabilityOrSensory: true,
        disabilityType: "HEARING_IMPAIRMENT",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDisabilityQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "I have a disability or sensory impairment" }),
    );

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      hasDisabilityOrSensory: true,
      disabilityType: "HEARING_IMPAIRMENT",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      hasDisabilityOrSensory: false,
      disabilityType: "",
    });
  });

  it("sets disability support to true when the option is checked", async () => {
    renderPage({
      formData: {
        hasDisabilityOrSensory: false,
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDisabilityQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "I have a disability or sensory impairment" }),
    );

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      hasDisabilityOrSensory: false,
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      hasDisabilityOrSensory: true,
    });
  });

  it("resets safe contact fields when domestic abuse is unchecked", async () => {
    renderPage({
      formData: {
        domesticAbuse: true,
        safeToContact: "no",
        safeContactNotes: "Use email only",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDomesticAbuseQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "I am a domestic abuse victim/survivor" }),
    );

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      domesticAbuse: true,
      safeToContact: "no",
      safeContactNotes: "Use email only",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      domesticAbuse: false,
      safeToContact: "PREFER_NOT_TO_SAY",
      safeContactNotes: "",
    });
  });

  it("sets domestic abuse to true when the option is checked", async () => {
    renderPage({
      formData: {
        domesticAbuse: false,
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDomesticAbuseQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", { name: "I am a domestic abuse victim/survivor" }),
    );

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      domesticAbuse: false,
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      domesticAbuse: true,
    });
  });

  it("renders the additional follow-up questions for the selected enquiry", () => {
    renderPage({
      formData: {
        hasChildren: true,
        hasDisabilityOrSensory: true,
        domesticAbuse: true,
        safeToContact: "no",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showChildrenQs: true,
        showDisabilityQs: true,
        showHouseholdSize: true,
        showDomesticAbuseQs: true,
        showAgeRange: true,
      },
    });

    expect(screen.getByText("Additional questions (optional)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I have dependent children" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "I have a disability or sensory impairment" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "How many children?" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select a type..." })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "How many people are in your household?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select an age range..." })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "I am a domestic abuse victim/survivor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Is it safe for us to contact you?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Safe time or method, or do not contact"),
    ).toBeInTheDocument();
  });

  it("updates age range when a selection is made", async () => {
    renderPage({
      formData: {
        ageRange: "",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showAgeRange: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select an age range..." }));
    await user.click(await screen.findByRole("option", { name: "18-24" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      ageRange: "",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      ageRange: "AGE_18_24",
    });
  });

  it("updates children count when a selection is made", async () => {
    renderPage({
      formData: {
        hasChildren: true,
        childrenCount: "",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showChildrenQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "How many children?" }));
    await user.click(await screen.findByRole("option", { name: "2" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      hasChildren: true,
      childrenCount: "",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      childrenCount: "2",
    });
  });

  it("updates disability type when a selection is made", async () => {
    renderPage({
      formData: {
        hasDisabilityOrSensory: true,
        disabilityType: "",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDisabilityQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select a type..." }));
    await user.click(await screen.findByRole("option", { name: "Hearing impairment" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      hasDisabilityOrSensory: true,
      disabilityType: "",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      disabilityType: "HEARING_IMPAIRMENT",
    });
  });

  it("updates household size when a selection is made", async () => {
    renderPage({
      formData: {
        householdSize: "",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showHouseholdSize: true,
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("combobox", { name: "How many people are in your household?" }),
    );
    await user.click(await screen.findByRole("option", { name: "4" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      householdSize: "",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      householdSize: "4",
    });
  });

  it("updates safe-to-contact when a new option is selected", async () => {
    renderPage({
      formData: {
        domesticAbuse: true,
        safeToContact: "PREFER_NOT_TO_SAY",
      },
      selectionState: {
        hasEnoughToProceed: true,
        showDomesticAbuseQs: true,
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Is it safe for us to contact you?" }));
    await user.click(await screen.findByRole("option", { name: "Yes" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      domesticAbuse: true,
      safeToContact: "PREFER_NOT_TO_SAY",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      safeToContact: "yes",
    });
  });

  it("reveals the extra support options when requested", () => {
    renderPage();

    expect(
      screen.queryByPlaceholderText("Any other support that would help today"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show more support options" }));

    expect(
      screen.getByPlaceholderText("Any other support that would help today"),
    ).toBeInTheDocument();
  });

  it("shows the urgent follow-up fields when urgent support details are needed", () => {
    renderPage({
      formData: {
        urgent: "yes",
        urgentReason: "OTHER",
      },
    });

    expect(screen.getByRole("combobox", { name: "Select a reason..." })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tell us why this is urgent")).toBeInTheDocument();
  });

  it('clears urgent fields when urgent support is no longer needed', async () => {
    renderPage({
      formData: {
        urgent: "yes",
        urgentReason: "OTHER",
        urgentReasonOtherText: "Needs help today",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: "No" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Needs help today",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      urgent: "no",
      urgentReason: "",
      urgentReasonOtherText: "",
    });
  });

  it("calls handleSave when save and continue later is pressed", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Save and continue later" }));

    expect(mockHandleSave).toHaveBeenCalled();
  });

  it("applies proceed change logic and clears appointment details", async () => {
    renderPage({
      formData: {
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: "2026-04-01",
        appointmentTime: "10:00",
      },
      selectionState: {
        hasEnoughToProceed: true,
      },
      canGoNext: true,
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select an option..." }));
    await user.click(await screen.findByRole("option", { name: "Join digital queue" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2026-04-01",
      appointmentTime: "10:00",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      proceed: "JOIN_DIGITAL_QUEUE",
      appointmentDateIso: "",
      appointmentTime: "",
    });
  });

  it("navigates to personal details when the form is submitted and can continue", () => {
    renderPage({
      canGoNext: true,
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockNavigate).toHaveBeenCalledWith("/form/personal-details");
  });

  it("does not navigate when the form is submitted and cannot continue", () => {
    renderPage({
      canGoNext: false,
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows support notes when the helper says they should be displayed", () => {
    renderPage({
      showSupportNotes: true,
    });

    expect(
      screen.getByPlaceholderText("Anything staff should know to support you today"),
    ).toBeInTheDocument();
  });

  it("updates the urgent reason and clears the other text when a predefined reason is chosen", async () => {
    renderPage({
      formData: {
        urgent: "yes",
        urgentReason: "OTHER",
        urgentReasonOtherText: "Needs help today",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Select a reason..." }));
    await user.click(await screen.findByRole("option", { name: "Health or mobility" }));

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Needs help today",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      urgentReason: "HEALTH_OR_MOBILITY",
      urgentReasonOtherText: "",
    });
  });
});

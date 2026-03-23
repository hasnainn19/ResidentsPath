import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

import type { FormData } from "../../../../src/pages/Form/model/formFieldTypes";

const { mockNavigate, mockSetFormData, mockHandleSave, testState } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockSetFormData: vi.fn(),
  mockHandleSave: vi.fn(),
  testState: {
    formData: null as FormData | null,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../../src/context/FormWizardProvider", () => ({
  useFormWizard: () => ({
    formData: testState.formData,
    setFormData: mockSetFormData,
    handleSave: mockHandleSave,
  }),
}));

vi.mock("../../../../src/components/FormPageComponents/FormStepLayout", () => ({
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

vi.mock("../../../../src/components/FormPageComponents/WithTTS", () => ({
  default: ({ children, copy }: { children: ReactNode; copy: { label?: string } }) => (
    <section>
      {copy.label ? <h2>{copy.label}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../../../src/components/TextToSpeechButton", () => ({
  default: () => null,
}));

vi.mock("../../../../src/components/FormPageComponents/StepActions", () => ({
  default: ({
    onSave,
    showPrevious,
    onPrevious,
    advanceLabel,
    advanceDisabled,
  }: {
    onSave: () => void;
    showPrevious?: boolean;
    onPrevious?: () => void;
    advanceLabel: string;
    advanceDisabled?: boolean;
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
      <button type="submit" disabled={advanceDisabled}>
        {advanceLabel}
      </button>
    </div>
  ),
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: { format?: (pattern: string) => string } | null;
    onChange?: (value: { format: (pattern: string) => string } | null) => void;
  }) => (
    <div>
      <input aria-label={label} readOnly value={value?.format?.("YYYY-MM-DD") ?? ""} />
      <button
        type="button"
        aria-label={`Set ${label}`}
        onClick={() =>
          onChange?.({
            format: () => "2001-02-03",
          })
        }
      >
        Set date
      </button>
    </div>
  ),
}));

import PersonalDetails from "../../../../src/pages/Form/PersonalDetails";

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

function renderPage(options?: { formData?: Partial<FormData> }) {
  testState.formData = makeFormData(options?.formData);
  return render(<PersonalDetails />);
}

describe("PersonalDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page title and optional detail sections", () => {
    renderPage();

    expect(screen.getByText("Council service request")).toBeInTheDocument();
    expect(screen.getByText("Would you like to provide your details?")).toBeInTheDocument();
    expect(screen.getByText("Personal details")).toBeInTheDocument();
    expect(screen.getByText("Contact details")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("calls handleSave when save and continue later is pressed", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Save and continue later" }));

    expect(mockHandleSave).toHaveBeenCalled();
  });

  it("clears stored personal details when the user chooses to continue without them", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: "No, continue without details" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      firstName: "Test",
      middleName: "T",
      lastName: "Tester",
      preferredName: "Test",
      email: "test.tester@example.com",
      phoneCountry: "US",
      phone: "+15551234567",
      dob: "1990-01-01",
      addressLine1: "1 High Street",
      addressLine2: "Flat 2",
      addressLine3: "Hounslow",
      townOrCity: "London",
      postcode: "TW3 1JL",
      pronouns: "OTHER",
      pronounsOtherText: "He/him",
      contactMethod: "EMAIL",
    });

    expect(updater(previousState)).toEqual(
      expect.objectContaining({
        provideDetails: "no",
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
        contactMethod: "",
      }),
    );
  });

  it("hides the optional detail sections when the user continues without details", async () => {
    const view = renderPage();
    const user = userEvent.setup();

    await user.click(screen.getByRole("radio", { name: "No, continue without details" }));

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    testState.formData = updater(makeFormData());
    view.rerender(<PersonalDetails />);

    await waitFor(() => {
      expect(screen.queryByText("Personal details")).not.toBeInTheDocument();
      expect(screen.queryByText("Contact details")).not.toBeInTheDocument();
      expect(screen.queryByText("Address")).not.toBeInTheDocument();
    });
  });

  it("disables continue when Email is selected without an email address", () => {
    renderPage({
      formData: {
        contactMethod: "EMAIL",
        email: "",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("disables continue when the email address is invalid", () => {
    renderPage({
      formData: {
        email: "test.tester@invalid@",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows the email helper text when the email address is invalid and blurred", () => {
    renderPage({
      formData: {
        email: "test.tester@invalid@",
      },
    });

    fireEvent.blur(screen.getByRole("textbox", { name: "Email (optional)" }));

    expect(screen.getByText("Enter a valid email address or leave blank.")).toBeInTheDocument();
  });

  it("disables continue when Text message is selected without a phone number", () => {
    renderPage({
      formData: {
        contactMethod: "TEXT_MESSAGE",
        phone: "",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows the contact-method helper text when Text message is selected without a phone number", () => {
    renderPage({
      formData: {
        contactMethod: "TEXT_MESSAGE",
        phone: "",
      },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(screen.getByText("To use Text message, add a phone number above.")).toBeInTheDocument();
  });

  it("shows the contact-method helper text when Email is selected without an email address", () => {
    renderPage({
      formData: {
        contactMethod: "EMAIL",
        email: "",
      },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(screen.getByText("To use Email, add an email address above.")).toBeInTheDocument();
  });

  it("updates contact method when a new option is selected", async () => {
    renderPage({
      formData: {
        contactMethod: "",
      },
    });
    const user = userEvent.setup();

    await user.click(
      screen.getByRole("combobox", { name: "Preferred method of contact (optional)" }),
    );
    await user.click(await screen.findByRole("option", { name: "Email" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      contactMethod: "",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      contactMethod: "EMAIL",
    });
  });

  it("disables continue when the phone number is invalid", () => {
    renderPage({
      formData: {
        phone: "not-a-number",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows the phone helper text when the phone number is invalid and blurred", () => {
    renderPage({
      formData: {
        phone: "not-a-number",
      },
    });

    fireEvent.blur(screen.getByRole("textbox", { name: "Phone number (optional)" }));

    expect(screen.getByText("Enter a valid phone number or leave blank.")).toBeInTheDocument();
  });

  it("disables continue when Other pronouns is selected without extra text", () => {
    renderPage({
      formData: {
        pronouns: "OTHER",
        pronounsOtherText: "",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("blocks submit when Other pronouns is selected without extra text", () => {
    renderPage({
      formData: {
        pronouns: "OTHER",
        pronounsOtherText: "",
      },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("clears the other pronouns text when a predefined pronouns option is chosen", async () => {
    renderPage({
      formData: {
        pronouns: "OTHER",
        pronounsOtherText: "He/him",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Pronouns (optional)" }));
    await user.click(await screen.findByRole("option", { name: "He/him" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      pronouns: "OTHER",
      pronounsOtherText: "He/him",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      pronouns: "HE_HIM",
      pronounsOtherText: "",
    });
  });

  it("sets dob and clears stale ageRange when a date of birth is chosen", async () => {
    renderPage({
      formData: {
        dob: "",
        ageRange: "AGE_25_34",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Set Date of birth (optional)" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      dob: "",
      ageRange: "AGE_25_34",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      dob: "2001-02-03",
      ageRange: "",
    });
  });

  it("preserves phone digits when the country changes and rebuilds the stored number", async () => {
    renderPage({
      formData: {
        phoneCountry: "GB",
        phone: "+447912345678",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("combobox", { name: "Country / dial code" }));
    await user.click(await screen.findByRole("option", { name: /United States/i }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      phoneCountry: "GB",
      phone: "+447912345678",
    });

    expect(updater(previousState)).toEqual(
      expect.objectContaining({
        phoneCountry: "US",
        phone: "+17912345678",
      }),
    );
  });

  it("strips leading zeroes and non-digit characters from UK phone input", () => {
    renderPage();

    fireEvent.change(screen.getByRole("textbox", { name: "Phone number (optional)" }), {
      target: { value: "07912-345678abc" },
    });

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData();

    expect(updater(previousState)).toEqual(
      expect.objectContaining({
        phone: "+447912345678",
      }),
    );
  });

  it("normalises the postcode on valid submit", () => {
    renderPage({
      formData: {
        postcode: "tw31jl",
      },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      postcode: "tw31jl",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      postcode: "TW3 1JL",
    });
  });

  it("navigates to the actions page on valid submit", () => {
    renderPage({
      formData: {
        postcode: "tw31jl",
      },
    });

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockNavigate).toHaveBeenCalledWith("/form/actions");
  });

  it("normalises the postcode when the field loses focus", () => {
    renderPage({
      formData: {
        postcode: "tw31jl",
      },
    });

    fireEvent.blur(screen.getByRole("textbox", { name: "Postcode (optional)" }));

    expect(mockSetFormData).toHaveBeenCalledTimes(1);

    const updater = mockSetFormData.mock.calls[0]?.[0] as (prev: FormData) => FormData;
    const previousState = makeFormData({
      postcode: "tw31jl",
    });

    expect(updater(previousState)).toEqual({
      ...previousState,
      postcode: "TW3 1JL",
    });
  });

  it("blocks submit and does not navigate when the postcode is invalid", () => {
    renderPage({
      formData: {
        postcode: "INVALID",
      },
    });

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    fireEvent.submit(screen.getByRole("button", { name: "Continue" }).closest("form")!);

    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByText("Enter a valid UK postcode (e.g. TW3 1JL) or leave blank."),
    ).toBeInTheDocument();
  });

  it("navigates back to enquiry selection when previous is pressed", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(mockNavigate).toHaveBeenCalledWith("/form/enquiry-selection");
  });
});

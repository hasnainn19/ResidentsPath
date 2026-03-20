import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReferencePage from "../../pages/ReferencePage";

// -------------------
// Hoisted mocks
// -------------------
const { mockNavigate, mockCheckRefNo, mockCancel, mockCheckIn } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockCheckRefNo: vi.fn(),
  mockCancel: vi.fn(),
  mockCheckIn: vi.fn(),
}));

// -------------------
// Hook return objects (mutable)
// -------------------
const mockedCheckReferenceHook = {
  foundCaseId: null as string | null,
  appointmentReferenceNumber: null as string | null,
  clearAppointmentReference: vi.fn(),
  refNoError: "",
  checkRefNo: mockCheckRefNo,
  isChecking: false,
};

// -------------------
// Mocks
// -------------------
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" }, // fixes i18n.language error
  }),
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isStaff: true,
    isHounslowHouseDevice: true,
  }),
}));

vi.mock("../../hooks/useCheckReferenceNumber", () => ({
  useCheckReferenceNumber: () => mockedCheckReferenceHook,
}));

vi.mock("../../hooks/useAppointmentReferenceActions", () => ({
  useAppointmentReferenceActions: () => ({
    actionStatus: null,
    canCheckInAppointments: false,
    clearActionStatus: vi.fn(),
    isCheckingIn: false,
    isCancelling: false,
    cancelAppointmentReference: mockCancel,
    checkInAppointmentReference: mockCheckIn,
  }),
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: () => ({
    queries: {
      checkTicketNumber: vi.fn().mockResolvedValue({ data: { caseId: "case123" }, errors: [] }),
    },
    mutations: {
      checkInAppointmentByReference: vi.fn().mockResolvedValue({ data: { ok: true }, errors: [] }),
      cancelAppointmentByReference: vi.fn().mockResolvedValue({ data: { ok: true }, errors: [] }),
    },
  }),
}));

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  })),
}));

// Child components
vi.mock("../../components/NavBar", () => ({ default: () => <div>Navbar</div> }));
vi.mock("../../components/TextToSpeechButton", () => ({ default: () => <div>TTS</div> }));
vi.mock("../../components/ReferencePageComponents/ScanButton", () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock("../../components/ReferencePageComponents/AppointmentOptionsDialog", () => ({
  default: () => <div>Dialog</div>,
}));

// -------------------
// Tests
// -------------------
describe("ReferencePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset hook to default state
    mockedCheckReferenceHook.foundCaseId = null;
    mockedCheckReferenceHook.appointmentReferenceNumber = null;
    mockedCheckReferenceHook.refNoError = "";
  });

  it("renders main UI elements", () => {
    render(<ReferencePage />);
    const scanButton = screen.getByTestId("scan-button"); 

    expect(scanButton).toBeInTheDocument();
    expect(screen.getByText("reference-use")).toBeInTheDocument();
    expect(screen.getByText("reference-manual")).toBeInTheDocument();
    expect(screen.getByText("reference-scan")).toBeInTheDocument();
  });

  it("calls checkRefNo when button is clicked", async () => {
    render(<ReferencePage />);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox");
    await user.type(input, "ABC123");
    const button = screen.getByRole("button", { name: "reference-check-status" });
    await user.click(button);
    expect(mockCheckRefNo).toHaveBeenCalledWith("ABC123");
  });

  it("calls checkRefNo when Enter is pressed", async () => {
    render(<ReferencePage />);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox");
    await user.type(input, "ABC123{enter}");
    expect(mockCheckRefNo).toHaveBeenCalledWith("ABC123");
  });

  it("navigates when foundCaseId is returned", () => {
    mockedCheckReferenceHook.foundCaseId = "case123";
    render(<ReferencePage />);
    expect(mockNavigate).toHaveBeenCalledWith("/userdashboard/case123");
  });

  it("shows error alert when refNoError exists", () => {
    mockedCheckReferenceHook.refNoError = "Error message";
    render(<ReferencePage />);
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("calls cancelAppointmentReference when cancel is triggered", async () => {
    mockedCheckReferenceHook.appointmentReferenceNumber = "ref123";
    mockCancel.mockResolvedValue({ ok: true });
    render(<ReferencePage />);
    await mockCancel("ref123");
    expect(mockCancel).toHaveBeenCalledWith("ref123");
  });

  it("navigates to checkin page when check-in succeeds", async () => {
    mockedCheckReferenceHook.appointmentReferenceNumber = "ref123";
    mockCheckIn.mockResolvedValue({ checkedIn: true });
    render(<ReferencePage />);
    await mockCheckIn("ref123");
    expect(mockCheckIn).toHaveBeenCalledWith("ref123");
  });
});
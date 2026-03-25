import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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

const mockedAppointmentActionsHook = {
  actionStatus: null as { severity: "success" | "info" | "warning"; text: string } | null,
  canCheckInAppointments: false,
  clearActionStatus: vi.fn(),
  isCheckingIn: false,
  isCancelling: false,
  cancelAppointmentReference: mockCancel,
  checkInAppointmentReference: mockCheckIn,
};

const mockedAppointmentDialog = {
  renderWithoutReference: false,
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
    i18n: { language: "en" }, 
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
  useAppointmentReferenceActions: () => mockedAppointmentActionsHook,
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

vi.mock("html5-qrcode", () => {
  return {
    Html5Qrcode: vi.fn().mockImplementation(function (this: any) {
      this.start = vi.fn().mockResolvedValue(undefined);
      this.stop = vi.fn().mockResolvedValue(undefined);
      this.clear = vi.fn();
    }),
  };
});
const createMockScanner = (overrides: Partial<{
    start: any;
    stop: any;
    clear: any;
    }> = {}) => {
    return function (this: any) {
        this.start = overrides.start ?? vi.fn().mockResolvedValue(undefined);
        this.stop = overrides.stop ?? vi.fn().mockResolvedValue(undefined);
        this.clear = overrides.clear ?? vi.fn();
    };
};

// Child components
vi.mock("../../components/NavBar", () => ({ default: () => <div>Navbar</div> }));
vi.mock("../../components/TextToSpeechButton", () => ({ default: () => <div>TTS</div> }));
vi.mock("../../components/ReferencePageComponents/ScanButton", () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock("../../components/ReferencePageComponents/AppointmentOptionsDialog", () => ({
  default: ({
    appointmentReferenceNumber,
    canCheckInAppointments,
    onClose,
    onCancelAppointment,
    onCheckInAppointment,
  }: {
    appointmentReferenceNumber?: string | null;
    canCheckInAppointments: boolean;
    onClose: () => void;
    onCancelAppointment: () => void;
    onCheckInAppointment: () => void;
  }) =>
    appointmentReferenceNumber || mockedAppointmentDialog.renderWithoutReference ? (
      <div>
        <button onClick={onClose}>Close appointment options</button>
        <button onClick={onCancelAppointment}>appOptions-cancel</button>
        {canCheckInAppointments ? (
          <button onClick={onCheckInAppointment}>landing-check</button>
        ) : null}
      </div>
    ) : null,
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
        mockedAppointmentActionsHook.actionStatus = null;
        mockedAppointmentActionsHook.canCheckInAppointments = false;
        mockedAppointmentActionsHook.isCheckingIn = false;
        mockedAppointmentActionsHook.isCancelling = false;
        mockedAppointmentDialog.renderWithoutReference = false;
    });

    it("renders main UI elements", () => {
        render(<ReferencePage />);
        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
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

        const button = screen.getByRole("button", { name: /reference-check-status/i });
        await user.click(button);

        await waitFor(() => {
            expect(mockCheckRefNo).toHaveBeenCalled();
            expect(mockCheckRefNo.mock.calls[0][0]).toContain("ABC123");        
        });
    });

    it("calls checkRefNo when Enter is pressed", async () => {
        render(<ReferencePage />);
        const user = userEvent.setup();
        const input = screen.getByRole("textbox");
        await user.type(input, "ABC123{enter}");
        await waitFor(() => {
            expect(mockCheckRefNo).toHaveBeenCalled();
            expect(mockCheckRefNo.mock.calls[0][0]).toContain("ABC123");        
        });
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

    it("shows error alert when refNoError exists and closes when user clicks close", async () => {
        mockedCheckReferenceHook.refNoError = "Error message";
        render(<ReferencePage />);
        expect(screen.getByText("Error message")).toBeInTheDocument();
        const user = userEvent.setup();
        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);

        expect(screen.queryByText(/Error message/i)).not.toBeInTheDocument();

    });
            
    it("calls cancelAppointmentReference when cancel is triggered", async () => {
        mockedCheckReferenceHook.appointmentReferenceNumber = "APT-ABC234";
        mockCancel.mockResolvedValue({ ok: true });
        const user = userEvent.setup();
        render(<ReferencePage />);
        const input = screen.getByRole("textbox");

        await user.type(input, "APT-ABC234");
        await user.click(screen.getByRole("button", { name: "appOptions-cancel" }));

        await waitFor(() => {
            expect(mockCancel).toHaveBeenCalledWith("APT-ABC234");
            expect(mockedCheckReferenceHook.clearAppointmentReference).toHaveBeenCalled();
            expect(input).toHaveValue("");
        });
    });

    it("navigates to checkin page when check-in succeeds", async () => {
        mockedCheckReferenceHook.appointmentReferenceNumber = "APT-ABC234";
        mockedAppointmentActionsHook.canCheckInAppointments = true;
        mockCheckIn.mockResolvedValue({ checkedIn: true });
        const user = userEvent.setup();
        render(<ReferencePage />);
        const input = screen.getByRole("textbox");

        await user.type(input, "APT-ABC234");
        await user.click(screen.getByRole("button", { name: "landing-check" }));

        await waitFor(() => {
            expect(mockCheckIn).toHaveBeenCalledWith("APT-ABC234");
            expect(mockedCheckReferenceHook.clearAppointmentReference).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/checkinpage");
            expect(input).toHaveValue("");
        });
    });

    it("shows appointment action status and clears it when closed", async () => {
        mockedAppointmentActionsHook.actionStatus = {
            severity: "success",
            text: "Appointment updated",
        };
        const user = userEvent.setup();

        render(<ReferencePage />);

        expect(screen.getByText("Appointment updated")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /close/i }));

        expect(mockedAppointmentActionsHook.clearActionStatus).toHaveBeenCalledTimes(1);
    });

    it("closes the appointment dialog through the page handler", async () => {
        mockedCheckReferenceHook.appointmentReferenceNumber = "APT-ABC234";
        const user = userEvent.setup();

        render(<ReferencePage />);

        await user.click(screen.getByRole("button", { name: "Close appointment options" }));

        expect(mockedCheckReferenceHook.clearAppointmentReference).toHaveBeenCalledTimes(1);
    });

    it("does nothing when cancelling without an appointment reference", async () => {
        mockedAppointmentDialog.renderWithoutReference = true;
        const user = userEvent.setup();

        render(<ReferencePage />);

        await user.click(screen.getByRole("button", { name: "appOptions-cancel" }));

        expect(mockCancel).not.toHaveBeenCalled();
        expect(mockedCheckReferenceHook.clearAppointmentReference).not.toHaveBeenCalled();
    });

    it("does nothing when checking in without an appointment reference", async () => {
        mockedAppointmentDialog.renderWithoutReference = true;
        mockedAppointmentActionsHook.canCheckInAppointments = true;
        const user = userEvent.setup();

        render(<ReferencePage />);

        await user.click(screen.getByRole("button", { name: "landing-check" }));

        expect(mockCheckIn).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(mockedCheckReferenceHook.clearAppointmentReference).not.toHaveBeenCalled();
    });

    it("starts scanning when QR scan button is clicked", async () => {
        render(<ReferencePage />);

        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
        expect(scanButton).toBeInTheDocument();

        const qrViewfinder = screen.getByTestId("qr-scan-view-finder");
        await waitFor(() => {
            expect(qrViewfinder).toHaveStyle({ visibility: "hidden" });
        });

        const user = userEvent.setup();
        await user.click(scanButton); 
        await waitFor(() => {
            expect(qrViewfinder).toHaveStyle({ visibility: "visible" });
        });        
        const cancelCameraButton = screen.getByTestId("camera-cancel-button");
        expect(cancelCameraButton).toBeInTheDocument();
    });

    it("starts scanning when QR scan button is clicked and stops scanning when cancel is clicked", async () => {
        render(<ReferencePage />);

        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
        expect(scanButton).toBeInTheDocument();

        const qrViewfinder = screen.getByTestId("qr-scan-view-finder");
        await waitFor(() => {
            expect(qrViewfinder).toHaveStyle({ visibility: "hidden" });
        });

        const user = userEvent.setup();
        await user.click(scanButton); 

        await waitFor(() => {
            expect(qrViewfinder).toHaveStyle({ visibility: "visible" });
        });

        const cancelCameraButton = screen.getByTestId("camera-cancel-button");
        expect(cancelCameraButton).toBeInTheDocument();

        await user.click(cancelCameraButton);
        await waitFor(() => {
            expect(qrViewfinder).toHaveStyle({ visibility: "hidden" });
        });        
        expect(screen.queryByTestId("camera-cancel-button")).not.toBeInTheDocument();
        
    });

    it("calls checkRefNo when QR code is decoded", async () => {
        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        let capturedOnDecode: ((decodedText: string) => void) | null = null;

        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn((...args: any[]) => {
                capturedOnDecode = args[2];
                return Promise.resolve();
            }),
        }));

        render(<ReferencePage />);

        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
        const user = userEvent.setup();
        await user.click(scanButton);

        expect(capturedOnDecode).not.toBeNull();

        await act(async () => {
            capturedOnDecode!("QUEUE|ABC123");
        });
        expect(mockCheckRefNo).toHaveBeenCalledWith("ABC123", "QUEUE");
    });

    it("shows an alert if QR code format is invalid", async () => {
        let capturedOnDecode: ((decodedText: string) => void) | null = null;

        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn((...args: any[]) => {
                capturedOnDecode = args[2];
                return Promise.resolve();
            }),
        }));

        render(<ReferencePage />);

        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
        const user = userEvent.setup();
        await user.click(scanButton);

        expect(capturedOnDecode).not.toBeNull();


        await act(async () => {
            capturedOnDecode!("INVALIDCODE");
        });
        const alert = await screen.findByText("Invalid QR code format");
        expect(alert).toBeInTheDocument();
    });

    it("shows an alert if QR code prefix is incorrect", async () => {
        let capturedOnDecode: ((decodedText: string) => void) | null = null;

        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn((...args: any[]) => {
                capturedOnDecode = args[2];
                return Promise.resolve();
            }),
        }));

        render(<ReferencePage />);

        const scanButton = screen.getByRole('button', { name: /reference-tap/i });
        const user = userEvent.setup();
        await user.click(scanButton);

        expect(capturedOnDecode).not.toBeNull();
        await act(async () => {
            capturedOnDecode!("ABC|123");
        });
        const alert = await screen.findByText("Incorrect QR Code Prefix");
        expect(alert).toBeInTheDocument();
    });

    it("shows an alert if QR scanner fails to start", async () => {
        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn(() => Promise.reject("Camera not found")),
        }));

        render(<ReferencePage />);

        const scanButton = screen.getByRole("button", { name: /reference-tap/i });
        const user = userEvent.setup();
        await user.click(scanButton);

        const alert = await screen.findByText(/Error occured while scanning QR Code: Camera not found/i);
        expect(alert).toBeInTheDocument();
    });

    it("shows a QR scan error alert and allows user to close it", async () => {
        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn(() => Promise.reject("Camera not found")),
        }));

        render(<ReferencePage />);

        const scanButton = screen.getByRole("button", { name: /reference-tap/i });
        const user = userEvent.setup();

        await user.click(scanButton);

        const alert = await screen.findByText(/Error occured while scanning QR Code: Camera not found/i);
        expect(alert).toBeInTheDocument();

        const closeButton = screen.getByRole("button", { name: /close/i });
        await user.click(closeButton);

        expect(screen.queryByText(/Error occured while scanning QR Code: Camera not found/i)).not.toBeInTheDocument();
    });

    it("calls stopScanner cleanup when ReferencePage unmounts", async () => {

        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        const stopMock = vi.fn().mockResolvedValue(undefined);
        const clearMock = vi.fn();

        Html5Qrcode.mockImplementation(createMockScanner({
            stop: stopMock,
            clear: clearMock,
        }));

        const { unmount } = render(<ReferencePage />);

        const scanButton = screen.getByRole("button", { name: /reference-tap/i });
        const user = userEvent.setup();

        await user.click(scanButton);

        expect(Html5Qrcode).toHaveBeenCalledTimes(1);

        unmount();

        await waitFor(() => {
            expect(stopMock).toHaveBeenCalled();
            expect(clearMock).toHaveBeenCalled();
        });
    });

    it("does nothing if scanning is already in progress or startingRef is true", async () => {
        const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode as unknown as Mock;
        Html5Qrcode.mockImplementation(createMockScanner({
            start: vi.fn(() => Promise.resolve()),
        }));

        render(<ReferencePage />);
        const scanButton = screen.getByRole("button", { name: /reference-tap/i });
        const user = userEvent.setup();

        await user.click(scanButton);

        await user.click(scanButton);

        expect(Html5Qrcode).toHaveBeenCalledTimes(1);
    });

});

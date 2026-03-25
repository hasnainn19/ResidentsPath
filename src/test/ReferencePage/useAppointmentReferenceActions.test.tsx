import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAppointmentReferenceActions } from "../../hooks/useAppointmentReferenceActions";

const {
  mockCheckInAppointmentByReference,
  mockCancelAppointmentByReference,
  mockGenerateClient,
  mockUseAuth,
  mockGetDataAuthMode,
} = vi.hoisted(() => ({
  mockCheckInAppointmentByReference: vi.fn(),
  mockCancelAppointmentByReference: vi.fn(),
  mockGenerateClient: vi.fn(),
  mockUseAuth: vi.fn(),
  mockGetDataAuthMode: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("../../utils/getDataAuthMode", () => ({
  getDataAuthMode: mockGetDataAuthMode,
}));

describe("useAppointmentReferenceActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});

    mockGenerateClient.mockReturnValue({
      mutations: {
        checkInAppointmentByReference: mockCheckInAppointmentByReference,
        cancelAppointmentByReference: mockCancelAppointmentByReference,
      },
    });

    mockUseAuth.mockReturnValue({
      isStaff: false,
      isHounslowHouseDevice: false,
    });

    mockGetDataAuthMode.mockResolvedValue("identityPool");
  });

  afterEach(() => {
    vi.mocked(console.error).mockRestore?.();
  });

  it("enables appointment check-in actions for staff users", () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    expect(result.current.canCheckInAppointments).toBe(true);
  });

  it("enables appointment check-in actions for Hounslow House devices", () => {
    mockUseAuth.mockReturnValue({
      isStaff: false,
      isHounslowHouseDevice: true,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    expect(result.current.canCheckInAppointments).toBe(true);
  });

  it("rejects invalid appointment references before check-in", async () => {
    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("bad")).resolves.toEqual({
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC234.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Enter an appointment reference number in the format APT-ABC234.",
    });
    expect(mockCheckInAppointmentByReference).not.toHaveBeenCalled();
  });

  it("blocks check-in away from Hounslow House for non-staff users", async () => {
    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "Appointment check-in is only available at Hounslow House.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Appointment check-in is only available at Hounslow House.",
    });
    expect(mockCheckInAppointmentByReference).not.toHaveBeenCalled();
  });

  it("checks in a valid appointment reference", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });
    mockCheckInAppointmentByReference.mockResolvedValue({
      data: { ok: true, checkedIn: true },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(
        result.current.checkInAppointmentReference(" apt-abc234 "),
      ).resolves.toEqual({
        ok: true,
        checkedIn: true,
        alreadyCheckedIn: undefined,
        errorMessage: undefined,
      });
    });

    expect(mockCheckInAppointmentByReference).toHaveBeenCalledWith(
      { referenceNumber: "APT-ABC234" },
      { authMode: "identityPool" },
    );
    expect(result.current.actionStatus).toBeNull();
    expect(result.current.isCheckingIn).toBe(false);
  });

  it("warns when a check-in is already in progress", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });

    let resolveCheckIn: ((value: { data: { ok: true }; errors: undefined }) => void) | undefined;
    mockCheckInAppointmentByReference.mockReturnValue(
      new Promise((resolve) => {
        resolveCheckIn = resolve;
      }),
    );

    const { result } = renderHook(() => useAppointmentReferenceActions());

    act(() => {
      void result.current.checkInAppointmentReference("APT-ABC234");
    });

    await waitFor(() => {
      expect(result.current.isCheckingIn).toBe(true);
    });

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "Check-in in progress, please wait",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Check-in in progress, please wait",
    });

    await act(async () => {
      resolveCheckIn?.({ data: { ok: true }, errors: undefined });
    });
  });

  it("shows an info status when the appointment was already checked in", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });
    mockCheckInAppointmentByReference.mockResolvedValue({
      data: { ok: true, alreadyCheckedIn: true },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await result.current.checkInAppointmentReference("APT-ABC234");
    });

    expect(result.current.actionStatus).toEqual({
      severity: "info",
      text: "This appointment has already been checked in.",
    });
  });

  it("shows a generic warning when check-in returns GraphQL errors", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });
    mockCheckInAppointmentByReference.mockResolvedValue({
      data: undefined,
      errors: [{ message: "boom" }],
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "We could not check in that appointment right now.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "We could not check in that appointment right now.",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the backend check-in error when the mutation returns ok false", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });
    mockCheckInAppointmentByReference.mockResolvedValue({
      data: { ok: false, errorMessage: "Appointment cannot be checked in yet." },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        checkedIn: undefined,
        alreadyCheckedIn: undefined,
        errorMessage: "Appointment cannot be checked in yet.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Appointment cannot be checked in yet.",
    });
  });

  it("shows a generic warning when check-in throws", async () => {
    mockUseAuth.mockReturnValue({
      isStaff: true,
      isHounslowHouseDevice: false,
    });
    mockCheckInAppointmentByReference.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.checkInAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "We could not check in that appointment right now.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "We could not check in that appointment right now.",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("rejects invalid appointment references before cancellation", async () => {
    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.cancelAppointmentReference("bad")).resolves.toEqual({
        ok: false,
        errorMessage: "Enter an appointment reference number in the format APT-ABC234.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Enter an appointment reference number in the format APT-ABC234.",
    });
    expect(mockCancelAppointmentByReference).not.toHaveBeenCalled();
  });

  it("cancels a valid appointment reference", async () => {
    mockCancelAppointmentByReference.mockResolvedValue({
      data: { ok: true },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(
        result.current.cancelAppointmentReference(" apt-abc234 "),
      ).resolves.toEqual({
        ok: true,
        errorMessage: undefined,
        alreadyCancelled: undefined,
      });
    });

    expect(mockCancelAppointmentByReference).toHaveBeenCalledWith(
      { referenceNumber: "APT-ABC234" },
      { authMode: "identityPool" },
    );
    expect(result.current.actionStatus).toEqual({
      severity: "success",
      text: "Your appointment has been cancelled.",
    });
    expect(result.current.isCancelling).toBe(false);
  });

  it("warns when a cancellation is already in progress", async () => {
    let resolveCancel: ((value: { data: { ok: true }; errors: undefined }) => void) | undefined;
    mockCancelAppointmentByReference.mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = resolve;
      }),
    );

    const { result } = renderHook(() => useAppointmentReferenceActions());

    act(() => {
      void result.current.cancelAppointmentReference("APT-ABC234");
    });

    await waitFor(() => {
      expect(result.current.isCancelling).toBe(true);
    });

    await act(async () => {
      await expect(result.current.cancelAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "Cancellation in progress, please wait",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Cancellation in progress, please wait",
    });

    await act(async () => {
      resolveCancel?.({ data: { ok: true }, errors: undefined });
    });
  });

  it("shows an info status when the appointment was already cancelled", async () => {
    mockCancelAppointmentByReference.mockResolvedValue({
      data: { ok: true, alreadyCancelled: true },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await result.current.cancelAppointmentReference("APT-ABC234");
    });

    expect(result.current.actionStatus).toEqual({
      severity: "info",
      text: "This appointment has already been cancelled.",
    });
  });

  it("shows a generic warning when cancellation returns GraphQL errors", async () => {
    mockCancelAppointmentByReference.mockResolvedValue({
      data: undefined,
      errors: [{ message: "boom" }],
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.cancelAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "We could not cancel that appointment right now.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "We could not cancel that appointment right now.",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("shows the backend cancellation error when the mutation returns ok false", async () => {
    mockCancelAppointmentByReference.mockResolvedValue({
      data: { ok: false, errorMessage: "Appointment cannot be cancelled." },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.cancelAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "Appointment cannot be cancelled.",
        alreadyCancelled: undefined,
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "Appointment cannot be cancelled.",
    });
  });

  it("shows a generic warning when cancellation throws", async () => {
    mockCancelAppointmentByReference.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await expect(result.current.cancelAppointmentReference("APT-ABC234")).resolves.toEqual({
        ok: false,
        errorMessage: "We could not cancel that appointment right now.",
      });
    });

    expect(result.current.actionStatus).toEqual({
      severity: "warning",
      text: "We could not cancel that appointment right now.",
    });
    expect(console.error).toHaveBeenCalled();
  });

  it("clears the action status", async () => {
    mockCancelAppointmentByReference.mockResolvedValue({
      data: { ok: true },
      errors: undefined,
    });

    const { result } = renderHook(() => useAppointmentReferenceActions());

    await act(async () => {
      await result.current.cancelAppointmentReference("APT-ABC234");
    });

    expect(result.current.actionStatus).not.toBeNull();

    act(() => {
      result.current.clearActionStatus();
    });

    expect(result.current.actionStatus).toBeNull();
  });
});

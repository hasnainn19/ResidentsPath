import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useCheckReferenceNumber } from "../../hooks/useCheckReferenceNumber";
import * as referenceNumbers from "../../../shared/referenceNumbers";

// -------------------
// Mocks
// -------------------
const mockCheckTicketNumber = vi.fn();
const mockGenerateClient = vi.fn(() => ({
    queries: { checkTicketNumber: mockCheckTicketNumber },
}));

vi.mock("aws-amplify/data", () => ({
    generateClient: () => mockGenerateClient(),
}));

const mockGetDataAuthMode = vi.fn();

vi.mock("../../hooks/utils/getDataAuthMode", () => ({
    getDataAuthMode: () => mockGetDataAuthMode(),
}));



describe("useCheckReferenceNumber hook", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(referenceNumbers, "normaliseReferenceNumber").mockImplementation((ref) => ref);
        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockImplementation((ref) => ref.startsWith("APP"));
    });

    it("sets refNoError if input is empty", async () => {
        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("");
        });

        expect(result.current.refNoError).toBe("Enter a reference number.");
    });

    it("calls checkTicketNo for ticket reference with no type", async () => {
        mockGetDataAuthMode.mockResolvedValue("API_KEY");
        mockCheckTicketNumber.mockResolvedValue({
            data: { caseId: "CASE123" },
            errors: [],
        });

        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("H001"); 
        });

        expect(mockCheckTicketNumber).toHaveBeenCalled();
        expect(result.current.foundCaseId).toBe("CASE123");
        expect(result.current.refNoError).toBe("");
    });

    it("calls checkTicketNo for ticket reference with no type", async () => {
        mockGetDataAuthMode.mockResolvedValue("API_KEY");
        mockCheckTicketNumber.mockResolvedValue({
            data: { caseId: "CASE123" },
            errors: [],
        });

        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("H001", "QUEUE"); 
        });

        expect(mockCheckTicketNumber).toHaveBeenCalled();
        expect(result.current.foundCaseId).toBe("CASE123");
        expect(result.current.refNoError).toBe("");
    });

    it("sets refNoError if ticket check gives errors", async () => {
        mockGetDataAuthMode.mockResolvedValue("API_KEY");
        mockCheckTicketNumber.mockResolvedValue({ data: null, errors: [{ message: "Ticket not found" }] });

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("TIC002", "QUEUE");
        });

        expect(result.current.refNoError).toBe("Ticket not found");
        expect(result.current.foundCaseId).toBe("");
    });

    it("clears appointmentReferenceNumber when clearAppointmentReference is called", () => {
        const { result } = renderHook(() => useCheckReferenceNumber());

        act(() => {
            result.current.checkRefNo("APP123");
        });

        act(() => {
            result.current.clearAppointmentReference();
        });

        expect(result.current.appointmentReferenceNumber).toBe("");
    });

    it("sets refNoError for invalid reference", async () => {
        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("INVALID");
        });

        expect(result.current.refNoError).toBe("INVALID is invalid");
    });

    it("sets refNoError if ticket check gives no data but no errors", async () => {
        mockGetDataAuthMode.mockResolvedValue("API_KEY");
        mockCheckTicketNumber.mockResolvedValue({ data: null, errors: [] });

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("TIC002", "QUEUE");
        });

        expect(result.current.refNoError).toBe("No ticket found");
        expect(result.current.foundCaseId).toBe("");
    });

    it("sets refNoError if checkTicketNumber throws an error", async () => {
        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

        mockCheckTicketNumber.mockImplementation(() => {
            throw new Error("Network error");
        });

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("H001"); 
        });

        await waitFor(() => {
            expect(result.current.refNoError).toBe("Failed to fetch ticket: Error: Network error");
            expect(result.current.foundCaseId).toBe("");
        });
    });

    it("does nothing if checkRefNo is called while already checking", async () => {
        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

        let resolveTicketCheck: Function;
        const ticketCheckPromise = new Promise((resolve) => {
            resolveTicketCheck = resolve;
        });

        mockCheckTicketNumber.mockReturnValue(ticketCheckPromise);

        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            result.current.checkRefNo("H001");
        });

        await act(async () => {
            await result.current.checkRefNo("H002");
        });

        await act(async () => {
            resolveTicketCheck!({ data: { caseId: "CASE123" }, errors: [] });
        });

        expect(mockCheckTicketNumber).toHaveBeenCalledTimes(1);
        expect(result.current.foundCaseId).toBe("CASE123");
        expect(result.current.refNoError).toBe("");
    });

    it("sets appointmentReferenceNumber for valid booking reference with no type", async () => {
        const { result } = renderHook(() => useCheckReferenceNumber());

        await act(async () => {
            await result.current.checkRefNo("APP123");
        });

        await waitFor(() => {
            expect(result.current.appointmentReferenceNumber).toBe("APP123");
            expect(result.current.refNoError).toBe("");
            expect(result.current.foundCaseId).toBe("");
        });
    });

    it("sets appointmentReferenceNumber for valid booking reference with type", async () => {
        const { result } = renderHook(() => useCheckReferenceNumber());
        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(true);

        await act(async () => {
            await result.current.checkRefNo("APP123", "APPOINTMENT");
        });

        await waitFor(() => {
            expect(result.current.appointmentReferenceNumber).toBe("APP123");
            expect(result.current.refNoError).toBe("");
            expect(result.current.foundCaseId).toBe("");
        });
    });

    it("sets refNoError for valid appointment type but invalid appointment reference", async () => {
        const { result } = renderHook(() => useCheckReferenceNumber());
        vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

        await act(async () => {
            await result.current.checkRefNo("AP123", "APPOINTMENT");
        });

        await waitFor(() => {
            expect(result.current.appointmentReferenceNumber).toBe("");
            expect(result.current.refNoError).toBe("AP123 is invalid");
            expect(result.current.foundCaseId).toBe("");
        });
    });
});
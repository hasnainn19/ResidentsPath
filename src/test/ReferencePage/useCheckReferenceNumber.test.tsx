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

    it("sets appointmentReferenceNumber for valid booking reference", async () => {
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

    it("calls checkTicketNo for ticket reference", async () => {
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

    // it("does nothing if checkRefNo is called while already checking", async () => {
    //     vi.spyOn(referenceNumbers, "isBookingReferenceNumber").mockReturnValue(false);

    //     mockCheckTicketNumber.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: { caseId: "CASE123" }, errors: [] }), 100)));

    //     const { result } = renderHook(() => useCheckReferenceNumber());

    //     const firstCall = act(async () => {
    //         result.current.checkRefNo("H001");
    //     });

    //     await act(async () => {
    //         await result.current.checkRefNo("H002"); 
    //     });

    //     await firstCall;

    //     expect(mockCheckTicketNumber).toHaveBeenCalledTimes(1);
    //     expect(result.current.foundCaseId).toBe("CASE123");
    //     expect(result.current.refNoError).toBe("");
    // });
});
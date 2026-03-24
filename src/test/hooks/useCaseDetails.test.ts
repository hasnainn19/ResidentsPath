import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGenerateClient,
  mockGetCaseDetails,
  mockCaseOnUpdate,
  mockTicketOnUpdate,
  mockTicketOnCreate,
} = vi.hoisted(() => ({
  mockGenerateClient: vi.fn(),
  mockGetCaseDetails: vi.fn(),
  mockCaseOnUpdate: vi.fn(),
  mockTicketOnUpdate: vi.fn(),
  mockTicketOnCreate: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: mockGenerateClient,
}));

import useCaseDetails from "../../hooks/useCaseDetails";

describe("useCaseDetails", () => {
  let caseSubscription: { unsubscribe: ReturnType<typeof vi.fn> };
  let ticketUpdateSubscription: { unsubscribe: ReturnType<typeof vi.fn> };
  let ticketCreateSubscription: { unsubscribe: ReturnType<typeof vi.fn> };
  let caseNext: (() => void) | undefined;
  let ticketUpdateNext: (() => void) | undefined;
  let ticketCreateNext: (() => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    caseSubscription = { unsubscribe: vi.fn() };
    ticketUpdateSubscription = { unsubscribe: vi.fn() };
    ticketCreateSubscription = { unsubscribe: vi.fn() };
    caseNext = undefined;
    ticketUpdateNext = undefined;
    ticketCreateNext = undefined;

    mockCaseOnUpdate.mockReturnValue({
      subscribe: vi.fn(({ next }) => {
        caseNext = next;
        return caseSubscription;
      }),
    });

    mockTicketOnUpdate.mockReturnValue({
      subscribe: vi.fn(({ next }) => {
        ticketUpdateNext = next;
        return ticketUpdateSubscription;
      }),
    });

    mockTicketOnCreate.mockReturnValue({
      subscribe: vi.fn(({ next }) => {
        ticketCreateNext = next;
        return ticketCreateSubscription;
      }),
    });

    mockGenerateClient.mockReturnValue({
      queries: {
        getCaseDetails: mockGetCaseDetails,
      },
      models: {
        Case: {
          onUpdate: mockCaseOnUpdate,
        },
        Ticket: {
          onUpdate: mockTicketOnUpdate,
          onCreate: mockTicketOnCreate,
        },
      },
    });
  });

  it("loads and maps case details", async () => {
    mockGetCaseDetails.mockResolvedValue({
      data: {
        caseName: "Housing support",
        referenceNumber: "REF-123",
        departmentName: "Housing",
        description: "Needs urgent help",
        status: "OPEN",
        priority: true,
        flag: false,
        notes: "Resident asked for callback",
        enquiry: "Housing enquiry",
        childrenCount: "2",
        householdSize: "4",
        ageRange: "25-34",
        hasDisabilityOrSensory: true,
        disabilityType: "Visual",
        domesticAbuse: false,
        safeToContact: "YES",
        safeContactNotes: "Call after 3pm",
        urgent: "yes",
        urgentReason: "At risk",
        urgentReasonOtherText: null,
        supportNotes: "Requires interpreter",
        supportNeeds: JSON.stringify(["Interpreter", "Quiet space"]),
        otherSupport: "Large print",
        additionalInfo: "Extra context",
        residentName: "Jane Doe",
        tickets: [{ ticketId: "ticket-1", ticketStatus: "WAITING" }],
      },
    });

    const { result } = renderHook(() => useCaseDetails("case-1"));

    await waitFor(() => {
      expect(mockGetCaseDetails).toHaveBeenCalledWith({ caseId: "case-1" });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.caseDetails).toEqual({
        caseName: "Housing support",
        referenceNumber: "REF-123",
        departmentName: "Housing",
        description: "Needs urgent help",
        status: "OPEN",
        priority: true,
        flag: false,
        notes: "Resident asked for callback",
        enquiry: "Housing enquiry",
        childrenCount: "2",
        householdSize: "4",
        ageRange: "25-34",
        hasDisabilityOrSensory: true,
        disabilityType: "Visual",
        domesticAbuse: false,
        safeToContact: "YES",
        safeContactNotes: "Call after 3pm",
        urgent: "yes",
        urgentReason: "At risk",
        urgentReasonOtherText: null,
        supportNotes: "Requires interpreter",
        supportNeeds: ["Interpreter", "Quiet space"],
        otherSupport: "Large print",
        additionalInfo: "Extra context",
        residentName: "Jane Doe",
        tickets: [{ ticketId: "ticket-1", ticketStatus: "WAITING" }],
      });
    });

    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: "userPool" });
    expect(mockCaseOnUpdate).toHaveBeenCalledWith({
      filter: { id: { eq: "case-1" } },
    });
    expect(mockTicketOnUpdate).toHaveBeenCalledWith({
      filter: { caseId: { eq: "case-1" } },
    });
    expect(mockTicketOnCreate).toHaveBeenCalledWith({
      filter: { caseId: { eq: "case-1" } },
    });
  });

  it("does nothing when no caseId is provided", () => {
    const { result } = renderHook(() => useCaseDetails(undefined));

    expect(mockGenerateClient).not.toHaveBeenCalled();
    expect(mockGetCaseDetails).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.caseDetails).toBeNull();
  });

  it("sets an error when the case is not found", async () => {
    mockGetCaseDetails.mockResolvedValue({ data: null });

    const { result } = renderHook(() => useCaseDetails("missing-case"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Case not found");
    });

    expect(result.current.caseDetails).toBeNull();
  });

  it("maps each returned ticket to ticketId and ticketStatus", async () => {
    mockGetCaseDetails.mockResolvedValue({
      data: {
        caseName: "Case with tickets",
        referenceNumber: "REF-TICKETS",
        supportNeeds: null,
        tickets: [
          { ticketId: "ticket-1", ticketStatus: "WAITING" },
          { ticketId: "ticket-2", ticketStatus: "COMPLETED" },
        ],
      },
    });

    const { result } = renderHook(() => useCaseDetails("case-with-tickets"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.caseDetails?.tickets).toEqual([
        { ticketId: "ticket-1", ticketStatus: "WAITING" },
        { ticketId: "ticket-2", ticketStatus: "COMPLETED" },
      ]);
    });
  });

  it("falls back to an empty ticket list when tickets are missing", async () => {
    mockGetCaseDetails.mockResolvedValue({
      data: {
        caseName: "Case without tickets",
        referenceNumber: "REF-NO-TICKETS",
        supportNeeds: null,
      },
    });

    const { result } = renderHook(() => useCaseDetails("case-without-tickets"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.caseDetails?.tickets).toEqual([]);
    });
  });

  it("uses the original error message when loading case details throws an Error", async () => {
    mockGetCaseDetails.mockRejectedValue(new Error("Service unavailable"));

    const { result } = renderHook(() => useCaseDetails("case-error"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Service unavailable");
    });

    expect(result.current.caseDetails).toBeNull();
  });

  it("sets a fallback error when loading case details rejects with a non-Error", async () => {
    mockGetCaseDetails.mockRejectedValue("network failure");

    const { result } = renderHook(() => useCaseDetails("case-fallback-error"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe("Failed to load case");
    });

    expect(result.current.caseDetails).toBeNull();
  });

  it("refetches when a subscription event arrives and unsubscribes on unmount", async () => {
    mockGetCaseDetails
      .mockResolvedValueOnce({
        data: {
          caseName: "Initial case",
          referenceNumber: "REF-1",
          supportNeeds: null,
          tickets: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          caseName: "Updated case",
          referenceNumber: "REF-1",
          supportNeeds: JSON.stringify(["BSL"]),
          tickets: [{ ticketId: "ticket-2", ticketStatus: "COMPLETED" }],
        },
      });

    const { result, unmount } = renderHook(() => useCaseDetails("case-2"));

    await waitFor(() => {
      expect(result.current.caseDetails?.caseName).toBe("Initial case");
    });

    await act(async () => {
      caseNext?.();
    });

    await waitFor(() => {
      expect(mockGetCaseDetails).toHaveBeenCalledTimes(2);
      expect(result.current.caseDetails?.caseName).toBe("Updated case");
      expect(result.current.caseDetails?.supportNeeds).toEqual(["BSL"]);
    });

    expect(ticketUpdateNext).toBeTypeOf("function");
    expect(ticketCreateNext).toBeTypeOf("function");

    unmount();

    expect(caseSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(ticketUpdateSubscription.unsubscribe).toHaveBeenCalledTimes(1);
    expect(ticketCreateSubscription.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

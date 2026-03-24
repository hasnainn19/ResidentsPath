import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import useServiceStats from "../../hooks/useServiceStats";

const { mockGenerateClient } = vi.hoisted(() => ({
  mockGenerateClient: vi.fn(),
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: (options: unknown) => mockGenerateClient(options),
}));

type ServiceStatsRecord = {
  departmentName: string;
  waitingCount: number;
  longestWait: number;
  averageWait: number;
  priorityCaseCount: number;
  standardCaseCount: number;
  steppedOutCount: number;
  availableStaff: number;
};

type SubscriptionKey =
  | "ticketCreate"
  | "ticketUpdate"
  | "ticketDelete"
  | "staffCreate"
  | "staffUpdate"
  | "staffDelete";

function makeStat(
  departmentName: string,
  overrides: Partial<ServiceStatsRecord> = {},
): ServiceStatsRecord {
  return {
    departmentName,
    waitingCount: 1,
    longestWait: 10,
    averageWait: 5,
    priorityCaseCount: 1,
    standardCaseCount: 2,
    steppedOutCount: 0,
    availableStaff: 3,
    ...overrides,
  };
}

function setupClient(
  responses: Array<{ data?: Array<ServiceStatsRecord | null> }>,
) {
  const handlers: Partial<Record<SubscriptionKey, () => void>> = {};
  const unsubscribes: Record<SubscriptionKey, ReturnType<typeof vi.fn>> = {
    ticketCreate: vi.fn(),
    ticketUpdate: vi.fn(),
    ticketDelete: vi.fn(),
    staffCreate: vi.fn(),
    staffUpdate: vi.fn(),
    staffDelete: vi.fn(),
  };

  let callIndex = 0;
  const getServiceStats = vi.fn().mockImplementation(() =>
    Promise.resolve(responses[callIndex++] ?? responses[responses.length - 1]),
  );

  const makeSubscription = (key: SubscriptionKey) => {
    const subscribe = vi.fn(({ next }: { next: () => void }) => {
      handlers[key] = next;
      return { unsubscribe: unsubscribes[key] };
    });

    return vi.fn(() => ({ subscribe }));
  };

  const client = {
    queries: {
      getServiceStats,
    },
    models: {
      Ticket: {
        onCreate: makeSubscription("ticketCreate"),
        onUpdate: makeSubscription("ticketUpdate"),
        onDelete: makeSubscription("ticketDelete"),
      },
      Staff: {
        onCreate: makeSubscription("staffCreate"),
        onUpdate: makeSubscription("staffUpdate"),
        onDelete: makeSubscription("staffDelete"),
      },
    },
  };

  mockGenerateClient.mockReturnValue(client);

  return { getServiceStats, handlers, unsubscribes };
}

describe("useServiceStats", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("maps query results, removes nulls and duplicate departments, refreshes on subscriptions, and unsubscribes on cleanup", async () => {
    const housing = makeStat("Housing", { waitingCount: 4, longestWait: 15 });
    const duplicateHousing = makeStat("Housing", { waitingCount: 99, longestWait: 99 });
    const benefits = makeStat("Benefits", { averageWait: 7, availableStaff: 2 });
    const parking = makeStat("Parking", { priorityCaseCount: 3, standardCaseCount: 5 });
    const councilTax = makeStat("Council Tax", { steppedOutCount: 2, availableStaff: 1 });

    const { getServiceStats, handlers, unsubscribes } = setupClient([
      { data: [null, housing, duplicateHousing, benefits] },
      {},
      { data: [parking] },
      { data: [councilTax] },
      { data: [housing] },
      { data: [benefits] },
      { data: [parking] },
    ]);

    const { result, unmount } = renderHook(() => useServiceStats());

    expect(result.current).toEqual([]);

    await waitFor(() => {
      expect(result.current).toEqual([housing, benefits]);
    });

    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: "userPool" });
    expect(getServiceStats).toHaveBeenCalledTimes(1);

    await act(async () => {
      handlers.ticketCreate?.();
      handlers.ticketUpdate?.();
      handlers.ticketDelete?.();
      handlers.staffCreate?.();
      handlers.staffUpdate?.();
      handlers.staffDelete?.();
    });

    await waitFor(() => {
      expect(getServiceStats).toHaveBeenCalledTimes(7);
      expect(result.current).toEqual([parking]);
    });

    unmount();

    expect(unsubscribes.ticketCreate).toHaveBeenCalledTimes(1);
    expect(unsubscribes.ticketUpdate).toHaveBeenCalledTimes(1);
    expect(unsubscribes.ticketDelete).toHaveBeenCalledTimes(1);
    expect(unsubscribes.staffCreate).toHaveBeenCalledTimes(1);
    expect(unsubscribes.staffUpdate).toHaveBeenCalledTimes(1);
    expect(unsubscribes.staffDelete).toHaveBeenCalledTimes(1);
  });
});

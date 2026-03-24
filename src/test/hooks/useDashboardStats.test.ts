import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import useDashboardStats from "../../hooks/useDashboardStats";

const mockGetDashboardStats = vi.fn();
const createSubscribe = vi.fn();
const updateSubscribe = vi.fn();
const deleteSubscribe = vi.fn();

const createUnsubscribe = vi.fn();
const updateUnsubscribe = vi.fn();
const deleteUnsubscribe = vi.fn();

const mockGenerateClient = vi.fn(() => ({
  queries: {
    getDashboardStats: mockGetDashboardStats,
  },
  models: {
    Ticket: {
      onCreate: () => ({ subscribe: createSubscribe }),
      onUpdate: () => ({ subscribe: updateSubscribe }),
      onDelete: () => ({ subscribe: deleteSubscribe }),
    },
  },
}));

vi.mock("aws-amplify/data", () => ({
  generateClient: (...args: []) => mockGenerateClient(...args),
}));

describe("useDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createSubscribe.mockReturnValue({ unsubscribe: createUnsubscribe });
    updateSubscribe.mockReturnValue({ unsubscribe: updateUnsubscribe });
    deleteSubscribe.mockReturnValue({ unsubscribe: deleteUnsubscribe });
  });

  it("returns initial zero stats before the dashboard query resolves", () => {
    mockGetDashboardStats.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current).toEqual({
      waitingCount: 0,
      steppedOutCount: 0,
      staffCount: 0,
      priorityCount: 0,
    });
    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: "userPool" });
    expect(mockGetDashboardStats).toHaveBeenCalledTimes(1);
    expect(mockGetDashboardStats).toHaveBeenCalledWith({});
  });

  it("maps dashboard query data into hook state", async () => {
    mockGetDashboardStats.mockResolvedValue({
      data: {
        waitingCount: 7,
        steppedOutCount: 3,
        staffCount: 5,
        priorityCount: 2,
      },
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 7,
        steppedOutCount: 3,
        staffCount: 5,
        priorityCount: 2,
      });
    });

    expect(createSubscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });
    expect(updateSubscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });
    expect(deleteSubscribe).toHaveBeenCalledWith({
      next: expect.any(Function),
    });
  });

  it("falls back to zero when the query returns partial or missing data", async () => {
    mockGetDashboardStats.mockResolvedValue({
      data: {
        waitingCount: 4,
        steppedOutCount: undefined,
        staffCount: null,
      },
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 4,
        steppedOutCount: 0,
        staffCount: 0,
        priorityCount: 0,
      });
    });
  });

  it("falls back to zero when the query resolves without a data ", async () => {
    mockGetDashboardStats.mockResolvedValue({});

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 0,
        steppedOutCount: 0,
        staffCount: 0,
        priorityCount: 0,
      });
    });
  });

  it("refetches stats when ticket subscriptions gets updated", async () => {
    const responses = [
      {
        data: {
          waitingCount: 1,
          steppedOutCount: 0,
          staffCount: 2,
          priorityCount: 0,
        },
      },
      {
        data: {
          waitingCount: 2,
          steppedOutCount: 1,
          staffCount: 2,
          priorityCount: 1,
        },
      },
      {
        data: {
          waitingCount: 3,
          steppedOutCount: 1,
          staffCount: 3,
          priorityCount: 1,
        },
      },
      {
        data: {
          waitingCount: 4,
          steppedOutCount: 2,
          staffCount: 3,
          priorityCount: 2,
        },
      },
    ];

    mockGetDashboardStats.mockImplementation(() =>
      Promise.resolve(responses.shift()),
    );

    let onCreateNext: (() => void) | undefined;
    let onUpdateNext: (() => void) | undefined;
    let onDeleteNext: (() => void) | undefined;

    createSubscribe.mockImplementation(({ next }) => {
      onCreateNext = next;
      return { unsubscribe: createUnsubscribe };
    });
    updateSubscribe.mockImplementation(({ next }) => {
      onUpdateNext = next;
      return { unsubscribe: updateUnsubscribe };
    });
    deleteSubscribe.mockImplementation(({ next }) => {
      onDeleteNext = next;
      return { unsubscribe: deleteUnsubscribe };
    });

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 1,
        steppedOutCount: 0,
        staffCount: 2,
        priorityCount: 0,
      });
    });

    onCreateNext?.();
    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 2,
        steppedOutCount: 1,
        staffCount: 2,
        priorityCount: 1,
      });
    });

    onUpdateNext?.();
    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 3,
        steppedOutCount: 1,
        staffCount: 3,
        priorityCount: 1,
      });
    });

    onDeleteNext?.();
    await waitFor(() => {
      expect(result.current).toEqual({
        waitingCount: 4,
        steppedOutCount: 2,
        staffCount: 3,
        priorityCount: 2,
      });
    });

    expect(mockGetDashboardStats).toHaveBeenCalledTimes(4);
  });

  it("unsubscribes all ticket subscriptions on unmount", () => {
    mockGetDashboardStats.mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useDashboardStats());

    unmount();

    expect(createUnsubscribe).toHaveBeenCalledTimes(1);
    expect(updateUnsubscribe).toHaveBeenCalledTimes(1);
    expect(deleteUnsubscribe).toHaveBeenCalledTimes(1);
  });
});

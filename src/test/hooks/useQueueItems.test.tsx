import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import useQueueItems, { type QueueItem } from "../../hooks/useQueueItems";

type Subscription = {
  next?: () => void | Promise<void>;
};

const mockGetQueueItems = vi.fn();
const mockTicketOnCreate = vi.fn();
const mockTicketOnUpdate = vi.fn();
const mockTicketOnDelete = vi.fn();
const mockCaseOnUpdate = vi.fn();
const mockGenerateClient = vi.fn();

vi.mock("aws-amplify/data", () => ({
  generateClient: (options: unknown) => mockGenerateClient(options),
}));

const buildItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  ticketId: "ticket-1",
  caseId: "case-1",
  ticketNumber: "H001",
  department: "Housing",
  title: "Title",
  description: "Description",
  priority: false,
  flag: false,
  position: 1,
  notes: null,
  ...overrides,
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("useQueueItems", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockTicketOnCreate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: ({ next }: Subscription) => ({
        unsubscribe: vi.fn(),
        next,
        filter,
      }),
    }));
    mockTicketOnUpdate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: ({ next }: Subscription) => ({
        unsubscribe: vi.fn(),
        next,
        filter,
      }),
    }));
    mockTicketOnDelete.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: ({ next }: Subscription) => ({
        unsubscribe: vi.fn(),
        next,
        filter,
      }),
    }));
    mockCaseOnUpdate.mockImplementation(() => ({
      subscribe: ({ next }: Subscription) => ({
        unsubscribe: vi.fn(),
        next,
      }),
    }));

    mockGenerateClient.mockReturnValue({
      queries: {
        getQueueItems: mockGetQueueItems,
      },
      models: {
        Ticket: {
          onCreate: mockTicketOnCreate,
          onUpdate: mockTicketOnUpdate,
          onDelete: mockTicketOnDelete,
        },
        Case: {
          onUpdate: mockCaseOnUpdate,
        },
      },
    });
  });

  it("fetches department queue items, filters nulls, and unsubscribes on cleanup", async () => {
    const queueItem = buildItem();
    const createUnsubscribe = vi.fn();
    const updateUnsubscribe = vi.fn();
    const deleteUnsubscribe = vi.fn();
    const caseUnsubscribe = vi.fn();

    mockTicketOnCreate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: () => ({ unsubscribe: createUnsubscribe, filter }),
    }));
    mockTicketOnUpdate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: () => ({ unsubscribe: updateUnsubscribe, filter }),
    }));
    mockTicketOnDelete.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: () => ({ unsubscribe: deleteUnsubscribe, filter }),
    }));
    mockCaseOnUpdate.mockImplementation(() => ({
      subscribe: () => ({ unsubscribe: caseUnsubscribe }),
    }));

    mockGetQueueItems.mockResolvedValue({
      data: [queueItem, null],
    });

    const { result, unmount } = renderHook(() => useQueueItems("Housing"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGenerateClient).toHaveBeenCalledWith({ authMode: "userPool" });
    expect(mockGetQueueItems).toHaveBeenCalledWith({ departmentName: "Housing" });
    expect(result.current.items).toEqual([queueItem]);
    expect(result.current.error).toBeNull();
    expect(mockTicketOnCreate).toHaveBeenCalledWith({
      filter: { departmentName: { eq: "Housing" } },
    });
    expect(mockTicketOnUpdate).toHaveBeenCalledWith({
      filter: { departmentName: { eq: "Housing" } },
    });
    expect(mockTicketOnDelete).toHaveBeenCalledWith({
      filter: { departmentName: { eq: "Housing" } },
    });
    expect(mockCaseOnUpdate).toHaveBeenCalledWith();

    unmount();

    expect(createUnsubscribe).toHaveBeenCalledTimes(1);
    expect(updateUnsubscribe).toHaveBeenCalledTimes(1);
    expect(deleteUnsubscribe).toHaveBeenCalledTimes(1);
    expect(caseUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("uses the unfiltered query args and refetches on subscription events", async () => {
    const firstItem = buildItem({ ticketId: "ticket-1", ticketNumber: "A001" });
    const secondItem = buildItem({ ticketId: "ticket-2", ticketNumber: "A002" });

    let createNext: (() => void | Promise<void>) | undefined;
    let caseUpdateNext: (() => void | Promise<void>) | undefined;
    const createUnsubscribe = vi.fn();
    const updateUnsubscribe = vi.fn();
    const deleteUnsubscribe = vi.fn();
    const caseUnsubscribe = vi.fn();

    mockTicketOnCreate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: ({ next }: Subscription) => {
        createNext = next;
        return { unsubscribe: createUnsubscribe, filter };
      },
    }));
    mockTicketOnUpdate.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: () => ({ unsubscribe: updateUnsubscribe, filter }),
    }));
    mockTicketOnDelete.mockImplementation(({ filter }: { filter?: unknown } = {}) => ({
      subscribe: () => ({ unsubscribe: deleteUnsubscribe, filter }),
    }));
    mockCaseOnUpdate.mockImplementation(() => ({
      subscribe: ({ next }: Subscription) => {
        caseUpdateNext = next;
        return { unsubscribe: caseUnsubscribe };
      },
    }));

    mockGetQueueItems
      .mockResolvedValueOnce({ data: [firstItem] })
      .mockResolvedValueOnce({ data: [secondItem] })
      .mockResolvedValueOnce({ data: [firstItem, secondItem] });

    const { result, unmount } = renderHook(() => useQueueItems(""));

    await waitFor(() => {
      expect(result.current.items).toEqual([firstItem]);
    });

    expect(mockGetQueueItems).toHaveBeenNthCalledWith(1, {});
    expect(mockTicketOnCreate).toHaveBeenCalledWith({ filter: undefined });
    expect(mockTicketOnUpdate).toHaveBeenCalledWith({ filter: undefined });
    expect(mockTicketOnDelete).toHaveBeenCalledWith({ filter: undefined });

    await act(async () => {
      await createNext?.();
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([secondItem]);
    });

    await act(async () => {
      await caseUpdateNext?.();
    });

    await waitFor(() => {
      expect(result.current.items).toEqual([firstItem, secondItem]);
    });

    unmount();

    expect(createUnsubscribe).toHaveBeenCalledTimes(1);
    expect(updateUnsubscribe).toHaveBeenCalledTimes(1);
    expect(deleteUnsubscribe).toHaveBeenCalledTimes(1);
    expect(caseUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("normalizes fetch errors and recovers when the department changes", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const resolvedItem = buildItem({ ticketId: "ticket-9", ticketNumber: "C009" });

    const ticketCreateUnsubscribes = [vi.fn(), vi.fn(), vi.fn()];
    const ticketUpdateUnsubscribes = [vi.fn(), vi.fn(), vi.fn()];
    const ticketDeleteUnsubscribes = [vi.fn(), vi.fn(), vi.fn()];
    const caseUpdateUnsubscribes = [vi.fn(), vi.fn(), vi.fn()];

    mockTicketOnCreate.mockImplementation(() => ({
      subscribe: () => ({
        unsubscribe: ticketCreateUnsubscribes[mockTicketOnCreate.mock.calls.length - 1],
      }),
    }));
    mockTicketOnUpdate.mockImplementation(() => ({
      subscribe: () => ({
        unsubscribe: ticketUpdateUnsubscribes[mockTicketOnUpdate.mock.calls.length - 1],
      }),
    }));
    mockTicketOnDelete.mockImplementation(() => ({
      subscribe: () => ({
        unsubscribe: ticketDeleteUnsubscribes[mockTicketOnDelete.mock.calls.length - 1],
      }),
    }));
    mockCaseOnUpdate.mockImplementation(() => ({
      subscribe: () => ({
        unsubscribe: caseUpdateUnsubscribes[mockCaseOnUpdate.mock.calls.length - 1],
      }),
    }));

    mockGetQueueItems
      .mockRejectedValueOnce("plain failure")
      .mockRejectedValueOnce(new Error("typed failure"))
      .mockResolvedValueOnce({ data: [resolvedItem] });

    const { result, rerender, unmount } = renderHook(
      ({ departmentName }) => useQueueItems(departmentName),
      { initialProps: { departmentName: "Housing" } },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error("plain failure"));
    expect(consoleError).toHaveBeenCalledWith(
      "useQueueItems: failed to fetch",
      "plain failure",
    );

    rerender({ departmentName: "Benefits" });

    await waitFor(() => {
      expect(result.current.error?.message).toBe("typed failure");
    });

    expect(ticketCreateUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(ticketUpdateUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(ticketDeleteUnsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(caseUpdateUnsubscribes[0]).toHaveBeenCalledTimes(1);

    rerender({ departmentName: "Support" });

    await waitFor(() => {
      expect(result.current.items).toEqual([resolvedItem]);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    expect(ticketCreateUnsubscribes[1]).toHaveBeenCalledTimes(1);
    expect(ticketUpdateUnsubscribes[1]).toHaveBeenCalledTimes(1);
    expect(ticketDeleteUnsubscribes[1]).toHaveBeenCalledTimes(1);
    expect(caseUpdateUnsubscribes[1]).toHaveBeenCalledTimes(1);

    unmount();

    expect(ticketCreateUnsubscribes[2]).toHaveBeenCalledTimes(1);
    expect(ticketUpdateUnsubscribes[2]).toHaveBeenCalledTimes(1);
    expect(ticketDeleteUnsubscribes[2]).toHaveBeenCalledTimes(1);
    expect(caseUpdateUnsubscribes[2]).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });

  it("can unmount before fetch completion without requiring subscriptions", () => {
    const deferred = createDeferred<{ data: QueueItem[] }>();
    mockGetQueueItems.mockReturnValue(deferred.promise);

    const { unmount } = renderHook(() => useQueueItems("Housing"));

    expect(() => unmount()).not.toThrow();

    deferred.resolve({ data: [buildItem()] });
  });

  it("treats a missing data payload as an empty queue", async () => {
    mockGetQueueItems.mockResolvedValue({});

    const { result } = renderHook(() => useQueueItems("Housing"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

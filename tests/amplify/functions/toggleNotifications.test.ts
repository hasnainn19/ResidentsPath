import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockTicketGet, mockTicketUpdate, mockCaseGet, mockUserGet, mockUserUpdate } =
  vi.hoisted(() => ({
    mockTicketGet: vi.fn(),
    mockTicketUpdate: vi.fn(),
    mockCaseGet: vi.fn(),
    mockUserGet: vi.fn(),
    mockUserUpdate: vi.fn(),
  }));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Ticket: {
        get: mockTicketGet,
        update: mockTicketUpdate,
      },
      Case: {
        get: mockCaseGet,
      },
      User: {
        get: mockUserGet,
        update: mockUserUpdate,
      },
    },
  }),
}));

import { handler } from "../../../amplify/functions/toggleNotifications/handler";

const makeEvent = (args: {
  ticketId?: string;
  caseId?: string;
  enabled?: boolean;
  contactMethod?: "SMS" | "EMAIL" | null;
  contactValue?: string | null;
}) => ({ arguments: args }) as any;

const makeTicket = (overrides = {}) => ({
  id: "ticket1",
  caseId: "case1",
  ...overrides,
});

const makeCase = (overrides = {}) => ({
  id: "case1",
  userId: "user1",
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: "user1",
  phoneNumber: null,
  email: null,
  ...overrides,
});

describe("toggleNotifications handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketUpdate.mockResolvedValue({ data: {} });
    mockUserUpdate.mockResolvedValue({ data: {} });
  });

  describe("input validation", () => {
    it("throws when enabled is true and contactMethod is missing", async () => {
      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactValue: "+441234567890" }), {} as any, {} as any),
      ).rejects.toThrow("contactMethod and contactValue are required when enabling notifications");
    });

    it("throws when enabled is true and contactValue is missing", async () => {
      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS" }), {} as any, {} as any),
      ).rejects.toThrow("contactMethod and contactValue are required when enabling notifications");
    });
  });

  describe("ticket lookup", () => {
    it("throws when ticket is not found", async () => {
      mockTicketGet.mockResolvedValue({ data: null });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: false }), {} as any, {} as any),
      ).rejects.toThrow("toggleNotifications: Ticket not found");

      expect(mockTicketUpdate).not.toHaveBeenCalled();
    });

    it("throws when the ticket does not belong to the given case", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket({ caseId: "other-case" }) });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: false }), {} as any, {} as any),
      ).rejects.toThrow("toggleNotifications: Not authorized");

      expect(mockTicketUpdate).not.toHaveBeenCalled();
    });
  });

  describe("enabling notifications", () => {
    it("throws when the case is not found", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket() });
      mockCaseGet.mockResolvedValue({ data: null });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS", contactValue: "+441234567890" }), {} as any, {} as any),
      ).rejects.toThrow("toggleNotifications: Case not found");
    });

    it("throws when the user is not found", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket() });
      mockCaseGet.mockResolvedValue({ data: makeCase() });
      mockUserGet.mockResolvedValue({ data: null });

      await expect(
        handler(makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS", contactValue: "+441234567890" }), {} as any, {} as any),
      ).rejects.toThrow("toggleNotifications: User not found");
    });

    describe("SMS contact method", () => {
      it("updates User.phoneNumber when not already set", async () => {
        mockTicketGet.mockResolvedValue({ data: makeTicket() });
        mockCaseGet.mockResolvedValue({ data: makeCase() });
        mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null }) });

        await handler(
          makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS", contactValue: "+441234567890" }),
          {} as any, {} as any,
        );

        expect(mockUserUpdate).toHaveBeenCalledWith({ id: "user1", phoneNumber: "+441234567890" });
      });

      it("does not update User when phoneNumber is already set", async () => {
        mockTicketGet.mockResolvedValue({ data: makeTicket() });
        mockCaseGet.mockResolvedValue({ data: makeCase() });
        mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: "+449999999999" }) });

        await handler(
          makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS", contactValue: "+441234567890" }),
          {} as any, {} as any,
        );

        expect(mockUserUpdate).not.toHaveBeenCalled();
        expect(mockTicketUpdate).toHaveBeenCalledWith({
          id: "ticket1",
          notificationsEnabled: true,
          notificationPreferredContactMethod: "SMS",
        });
      });
    });

    describe("EMAIL contact method", () => {
      it("updates User.email when not already set", async () => {
        mockTicketGet.mockResolvedValue({ data: makeTicket() });
        mockCaseGet.mockResolvedValue({ data: makeCase() });
        mockUserGet.mockResolvedValue({ data: makeUser({ email: null }) });

        await handler(
          makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "EMAIL", contactValue: "test@example.com" }),
          {} as any, {} as any,
        );

        expect(mockUserUpdate).toHaveBeenCalledWith({ id: "user1", email: "test@example.com" });
        expect(mockTicketUpdate).toHaveBeenCalledWith({
          id: "ticket1",
          notificationsEnabled: true,
          notificationPreferredContactMethod: "EMAIL",
        });
      });

      it("does not update User when email is already set", async () => {
        mockTicketGet.mockResolvedValue({ data: makeTicket() });
        mockCaseGet.mockResolvedValue({ data: makeCase() });
        mockUserGet.mockResolvedValue({ data: makeUser({ email: "existing@example.com" }) });

        await handler(
          makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "EMAIL", contactValue: "test@example.com" }),
          {} as any, {} as any,
        );

        expect(mockUserUpdate).not.toHaveBeenCalled();
        expect(mockTicketUpdate).toHaveBeenCalledWith({
          id: "ticket1",
          notificationsEnabled: true,
          notificationPreferredContactMethod: "EMAIL",
        });
      });
    });

    it("updates Ticket with notificationsEnabled true and the contact method", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket() });
      mockCaseGet.mockResolvedValue({ data: makeCase() });
      mockUserGet.mockResolvedValue({ data: makeUser() });

      await handler(
        makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: true, contactMethod: "SMS", contactValue: "+441234567890" }),
        {} as any, {} as any,
      );

      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "ticket1",
        notificationsEnabled: true,
        notificationPreferredContactMethod: "SMS",
      });
    });
  });

  describe("disabling notifications", () => {
    it("updates Ticket with notificationsEnabled false and null contact method", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket() });

      await handler(
        makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: false }),
        {} as any, {} as any,
      );

      expect(mockTicketUpdate).toHaveBeenCalledWith({
        id: "ticket1",
        notificationsEnabled: false,
        notificationPreferredContactMethod: null,
      });
    });

    it("does not fetch Case or User", async () => {
      mockTicketGet.mockResolvedValue({ data: makeTicket() });

      await handler(
        makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: false }),
        {} as any, {} as any,
      );

      expect(mockCaseGet).not.toHaveBeenCalled();
      expect(mockUserGet).not.toHaveBeenCalled();
    });
  });

  it("returns { success: true } on success", async () => {
    mockTicketGet.mockResolvedValue({ data: makeTicket() });

    const result = await handler(
      makeEvent({ ticketId: "ticket1", caseId: "case1", enabled: false }),
      {} as any, {} as any,
    );

    expect(result).toEqual({ success: true });
  });
});

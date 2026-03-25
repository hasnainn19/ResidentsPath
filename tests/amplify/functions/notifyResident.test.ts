import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const { mockCaseGet, mockUserGet, mockSmsSend, mockEmailSend, mockUnmarshall } = vi.hoisted(() => ({
  mockCaseGet: vi.fn(),
  mockUserGet: vi.fn(),
  mockSmsSend: vi.fn(),
  mockEmailSend: vi.fn(),
  mockUnmarshall: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      Case: { get: mockCaseGet },
      User: { get: mockUserGet },
    },
  }),
}));

vi.mock("@aws-sdk/util-dynamodb", () => ({
  unmarshall: mockUnmarshall,
}));

vi.mock("../../../amplify/functions/utils/endUserMessagingClient", () => ({
  endUserMessagingClient: { send: mockSmsSend },
}));

vi.mock("../../../amplify/functions/utils/sesClient", () => ({
  sesClient: { send: mockEmailSend },
}));

import { handler } from "../../../amplify/functions/notifyResident/handler";

function makeRecord(
  eventName: string,
  newImage?: Record<string, any>,
  oldImage?: Record<string, any>
) {
  return {
    eventName,
    dynamodb: {
      ...(newImage !== undefined && { NewImage: newImage }),
      ...(oldImage !== undefined && { OldImage: oldImage }),
    },
  } as any;
}

function makeEvent(...records: ReturnType<typeof makeRecord>[]) {
  return { Records: records } as any;
}

function makeNotifyRecord(newOverrides: Record<string, any> = {}, oldOverrides: Record<string, any> = {}) {
  return makeRecord(
    "MODIFY",
    {
      caseId: "case1",
      ticketNumber: "H001",
      notificationsEnabled: true,
      notificationPreferredContactMethod: "SMS",
      position: 0,
      estimatedWaitTimeLower: 0,
      ...newOverrides,
    },
    {
      position: 1,
      estimatedWaitTimeLower: 15,
      ...oldOverrides,
    }
  );
}

const makeCase = () => ({ id: "case1", userId: "user1" });

const makeUser = (overrides: Record<string, any> = {}) => ({
  id: "user1",
  phoneNumber: "+441234567890",
  email: null,
  ...overrides,
});

describe("notifyResident handler", () => {
  beforeEach(() => {
    mockUnmarshall.mockImplementation((x: any) => x);
    mockCaseGet.mockResolvedValue({ data: makeCase() });
    mockUserGet.mockResolvedValue({ data: makeUser() });
    mockSmsSend.mockResolvedValue({});
    mockEmailSend.mockResolvedValue({});

    process.env.SMS_ORIGINATION_IDENTITY = "sms-identity-arn";
    process.env.SENDER_EMAIL = "noreply@hounslow.gov.uk";

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();

    delete process.env.SMS_ORIGINATION_IDENTITY;
    delete process.env.SENDER_EMAIL;
  });

  describe("validateTicketRecord", () => {
    it("skips non-MODIFY records", async () => {
      const record = makeRecord("INSERT", { caseId: "case1", ticketNumber: "H001" }, { position: 1 });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockCaseGet).not.toHaveBeenCalled();
    });

    it("skips MODIFY with no NewImage", async () => {
      const record = makeRecord("MODIFY", undefined, { position: 1 });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockCaseGet).not.toHaveBeenCalled();
    });

    it("skips MODIFY with no OldImage", async () => {
      const record = makeRecord("MODIFY", { caseId: "case1", ticketNumber: "H001" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockCaseGet).not.toHaveBeenCalled();
    });

    it("logs error and skips when caseId is missing", async () => {
      const record = makeRecord("MODIFY", { ticketNumber: "H001" }, { position: 1 });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockCaseGet).not.toHaveBeenCalled();
    });

    it("logs error and skips when ticketNumber is missing", async () => {
      const record = makeRecord("MODIFY", { caseId: "case1" }, { position: 1 });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockCaseGet).not.toHaveBeenCalled();
    });
  });

  describe("notificationsEnabled", () => {
    it("skips record when notificationsEnabled is false", async () => {
      const record = makeNotifyRecord({ notificationsEnabled: false });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockCaseGet).not.toHaveBeenCalled();
    });
  });

  describe("shouldNotifyResident", () => {
    it("sends notification when position drops to 0 (being served)", async () => {
      const record = makeNotifyRecord({ position: 0 }, { position: 1 });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input.MessageBody).toContain("being served");
    });

    it("sends notification when estimatedWaitTimeLower crosses ≤10", async () => {
      const record = makeNotifyRecord(
        { position: 1, estimatedWaitTimeLower: 8 },
        { position: 2, estimatedWaitTimeLower: 12 }
      );

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input.MessageBody).toContain("10 minutes");
    });

    it("sends notification when estimatedWaitTimeLower crosses ≤20", async () => {
      const record = makeNotifyRecord(
        { position: 1, estimatedWaitTimeLower: 18 },
        { position: 2, estimatedWaitTimeLower: 25 }
      );

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input.MessageBody).toContain("20 minutes");
    });

    it("sends notification when estimatedWaitTimeLower crosses ≤30", async () => {
      const record = makeNotifyRecord(
        { position: 1, estimatedWaitTimeLower: 28 },
        { position: 2, estimatedWaitTimeLower: 35 }
      );

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input.MessageBody).toContain("30 minutes");
    });

    it("sends notification when estimatedWaitTimeLower crosses ≤60", async () => {
      const record = makeNotifyRecord(
        { position: 1, estimatedWaitTimeLower: 55 },
        { position: 2, estimatedWaitTimeLower: 65 }
      );

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input.MessageBody).toContain("60 minutes");
    });

    it("skips notification when no threshold is crossed", async () => {
      const record = makeNotifyRecord(
        { position: 2, estimatedWaitTimeLower: 70 },
        { position: 3, estimatedWaitTimeLower: 75 }
      );

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).not.toHaveBeenCalled();
      expect(mockCaseGet).not.toHaveBeenCalled();
    });
  });

  describe("case and user lookup", () => {
    it("logs error and skips when Case is not found", async () => {
      mockCaseGet.mockResolvedValue({ data: null });

      await handler(makeEvent(makeNotifyRecord()), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockSmsSend).not.toHaveBeenCalled();
    });

    it("logs error and skips when User is not found", async () => {
      mockUserGet.mockResolvedValue({ data: null });

      await handler(makeEvent(makeNotifyRecord()), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockSmsSend).not.toHaveBeenCalled();
    });
  });

  describe("contact info", () => {
    it("logs and skips when both phoneNumber and email are null", async () => {
      mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null, email: null }) });

      await handler(makeEvent(makeNotifyRecord()), {} as any, {} as any);

      expect(console.log).toHaveBeenCalled();
      expect(mockSmsSend).not.toHaveBeenCalled();
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe("contact dispatch", () => {
    it("sends SMS with correct params when preferred method is SMS", async () => {
      const record = makeNotifyRecord({ notificationPreferredContactMethod: "SMS" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockSmsSend).toHaveBeenCalledTimes(1);
      expect(mockSmsSend.mock.calls[0][0].input).toMatchObject({
        DestinationPhoneNumber: "+441234567890",
        OriginationIdentity: "sms-identity-arn",
        MessageType: "TRANSACTIONAL",
      });
    });

    it("sends email with correct params when preferred method is EMAIL", async () => {
      mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null, email: "resident@example.com" }) });
      const record = makeNotifyRecord({ notificationPreferredContactMethod: "EMAIL" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(mockEmailSend).toHaveBeenCalledTimes(1);
      expect(mockEmailSend.mock.calls[0][0].input).toMatchObject({
        FromEmailAddress: "noreply@hounslow.gov.uk",
        Destination: { ToAddresses: ["resident@example.com"] },
      });
    });

    it("logs error when preferred method is SMS but phoneNumber is null", async () => {
      mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null, email: "resident@example.com" }) });
      const record = makeNotifyRecord({ notificationPreferredContactMethod: "SMS" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockSmsSend).not.toHaveBeenCalled();
    });
  });

  describe("sendSms", () => {
    it("logs error and returns early when SMS_ORIGINATION_IDENTITY is not set", async () => {
      delete process.env.SMS_ORIGINATION_IDENTITY;

      await handler(makeEvent(makeNotifyRecord()), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockSmsSend).not.toHaveBeenCalled();
    });

    it("logs error when endUserMessagingClient.send throws", async () => {
      mockSmsSend.mockRejectedValue(new Error("Pinpoint unavailable"));

      await handler(makeEvent(makeNotifyRecord()), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("sendEmail", () => {
    it("logs error and returns early when SENDER_EMAIL is not set", async () => {
      delete process.env.SENDER_EMAIL;
      mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null, email: "resident@example.com" }) });
      const record = makeNotifyRecord({ notificationPreferredContactMethod: "EMAIL" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
      expect(mockEmailSend).not.toHaveBeenCalled();
    });

    it("logs error when sesClient.send throws", async () => {
      mockEmailSend.mockRejectedValue(new Error("SES unavailable"));
      mockUserGet.mockResolvedValue({ data: makeUser({ phoneNumber: null, email: "resident@example.com" }) });
      const record = makeNotifyRecord({ notificationPreferredContactMethod: "EMAIL" });

      await handler(makeEvent(record), {} as any, {} as any);

      expect(console.error).toHaveBeenCalled();
    });
  });
});

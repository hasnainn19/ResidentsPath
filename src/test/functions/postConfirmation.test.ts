import { vi, describe, it, expect, beforeEach } from "vitest";

const { mockCognitoSend, mockUserCreate } = vi.hoisted(() => ({
  mockCognitoSend: vi.fn(),
  mockUserCreate: vi.fn(),
}));

vi.mock("../../../amplify/functions/utils/cognitoClient", () => ({
  cognitoClient: { send: mockCognitoSend },
}));

vi.mock("../../../amplify/functions/utils/amplifyClient", () => ({
  getAmplifyClient: vi.fn().mockResolvedValue({
    models: {
      User: { create: mockUserCreate },
    },
  }),
}));

import { handler } from "../../../amplify/functions/postConfirmation/handler";

const makeEvent = (overrides: Record<string, unknown> = {}) =>
  ({
    userPoolId: "eu-west-2_aB3cD4eF5",
    userName: "testuser@example.com",
    request: {
      userAttributes: {
        sub: "cognito-sub-uuid-123",
        email: "testuser@example.com",
        given_name: "Jane",
        family_name: "Smith",
      },
    },
    ...overrides,
  }) as any;

describe("postConfirmation handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCognitoSend.mockResolvedValue({});
    mockUserCreate.mockResolvedValue({ data: { id: "cognito-sub-uuid-123" }, errors: undefined });
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("adds the user to the Residents group with correct params", async () => {
    const event = makeEvent();
    await handler(event, {} as any, {} as any);

    expect(mockCognitoSend).toHaveBeenCalledTimes(1);
    const command = mockCognitoSend.mock.calls[0][0];
    expect(command.input).toEqual({
      UserPoolId: "eu-west-2_aB3cD4eF5",
      Username: "testuser@example.com",
      GroupName: "Residents",
    });
  });

  it("still creates User record when Cognito group add fails", async () => {
    mockCognitoSend.mockRejectedValue(new Error("Cognito unavailable"));
    const event = makeEvent();

    await handler(event, {} as any, {} as any);

    expect(mockUserCreate).toHaveBeenCalledTimes(1);
  });

  it("creates User record with correct fields from event attributes", async () => {
    await handler(makeEvent(), {} as any, {} as any);

    expect(mockUserCreate).toHaveBeenCalledWith({
      id: "cognito-sub-uuid-123",
      isRegistered: true,
      email: "testuser@example.com",
      firstName: "Jane",
      lastName: "Smith",
    });
  });

  it("logs errors when User.create returns errors", async () => {
    mockUserCreate.mockResolvedValue({
      data: null,
      errors: [{ message: "DynamoDB write failed", errorType: "InternalError" }],
    });
    const event = makeEvent();

    await handler(event, {} as any, {} as any);

    expect(console.error).toHaveBeenCalled();
  });

  it("catches and logs error when User.create throws", async () => {
    mockUserCreate.mockRejectedValue(new Error("AppSync unreachable"));

    await handler(makeEvent(), {} as any, {} as any);

    expect(console.error).toHaveBeenCalled();
  });

  it("always returns the original event object", async () => {
    const event = makeEvent();

    const result = await handler(event, {} as any, {} as any);

    expect(result).toBe(event);
  });
});

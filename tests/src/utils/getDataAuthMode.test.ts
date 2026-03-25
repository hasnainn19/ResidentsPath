import { afterEach, describe, expect, it, vi } from "vitest";

import { getDataAuthMode } from "../../../src/utils/getDataAuthMode";

const { mockFetchAuthSession } = vi.hoisted(() => ({
  mockFetchAuthSession: vi.fn(),
}));

vi.mock("aws-amplify/auth", () => ({
  fetchAuthSession: () => mockFetchAuthSession(),
}));

describe("getDataAuthMode", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns userPool when the session includes an ID token", async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        idToken: {
          payload: {},
        },
      },
    });

    await expect(getDataAuthMode()).resolves.toBe("userPool");
    expect(mockFetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it("returns identityPool when the session has no ID token", async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: {
        accessToken: {
          payload: {},
        },
      },
    });

    await expect(getDataAuthMode()).resolves.toBe("identityPool");
  });

  it("returns identityPool when the session has no tokens", async () => {
    mockFetchAuthSession.mockResolvedValue({});

    await expect(getDataAuthMode()).resolves.toBe("identityPool");
  });
});

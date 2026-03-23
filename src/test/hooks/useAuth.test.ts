import { renderHook, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import { useAuth } from "../../hooks/useAuth";

const mockUseAuthenticator = vi.fn();
const mockFetchAuthSession = vi.fn();

vi.mock("@aws-amplify/ui-react", () => ({
    useAuthenticator: (selector: (ctx: unknown) => unknown) => mockUseAuthenticator(selector),
}));

vi.mock("aws-amplify/auth", () => ({
    fetchAuthSession: () => mockFetchAuthSession(),
}));

function makeSession({
    idGroups,
    accessGroups,
    email = "test@example.com",
    givenName = "John",
    familyName = "Doe",
}: {
    idGroups?: unknown;
    accessGroups?: unknown;
    email?: string;
    givenName?: string;
    familyName?: string;
}) {
    return {
        tokens: {
            idToken: {
                payload: {
                    "cognito:groups": idGroups,
                    email,
                    given_name: givenName,
                    family_name: familyName,
                },
            },
            accessToken: {
                payload: {
                    "cognito:groups": accessGroups,
                },
            },
        },
    };
}

describe("useAuth", () => {

    afterEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it("stays loading and does not call fetchAuthSession when authStatus is configuring", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "configuring" });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(true);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(mockFetchAuthSession).not.toHaveBeenCalled();
    });

    it("sets unauthenticated state when authStatus is unauthenticated", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "unauthenticated" });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.groups).toBeNull();
        expect(result.current.email).toBeNull();
        expect(result.current.givenName).toBeNull();
        expect(result.current.familyName).toBeNull();
        expect(mockFetchAuthSession).not.toHaveBeenCalled();
    });

    it("sets authenticated state with all fields and derived flags from ID token", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockResolvedValue(makeSession({
            idGroups: ["Staff", "Residents", "HounslowHouseDevices"],
            email: "staff@example.com",
            givenName: "Jane",
            familyName: "Smith",
        }));

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.groups).toEqual(["Staff", "Residents", "HounslowHouseDevices"]);
        expect(result.current.isStaff).toBe(true);
        expect(result.current.isResident).toBe(true);
        expect(result.current.isHounslowHouseDevice).toBe(true);
        expect(result.current.email).toBe("staff@example.com");
        expect(result.current.givenName).toBe("Jane");
        expect(result.current.familyName).toBe("Smith");
    });

    it("normalises a string group claim in the ID token to an array", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockResolvedValue(makeSession({ idGroups: "Staff" }));

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.groups).toEqual(["Staff"]);
        expect(result.current.isStaff).toBe(true);
    });

    it("falls back to access token groups when ID token has no groups claim", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockResolvedValue({
            tokens: {
                idToken: { payload: { email: "test@example.com" } },
                accessToken: { payload: { "cognito:groups": ["Staff"] } },
            },
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.groups).toEqual(["Staff"]);
        expect(result.current.isStaff).toBe(true);
    });

    it("sets groups to null when neither token has a groups claim", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockResolvedValue({
            tokens: {
                idToken: { payload: { email: "test@example.com" } },
                accessToken: { payload: {} },
            },
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.groups).toBeNull();
        expect(result.current.isStaff).toBe(false);
        expect(result.current.isResident).toBe(false);
        expect(result.current.isHounslowHouseDevice).toBe(false);
    });

    it("sets profile fields to null when token payload has no email, given name, or family name", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockResolvedValue({
            tokens: {
                idToken: { payload: { "cognito:groups": ["Staff"] } },
                accessToken: { payload: {} },
            },
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.email).toBeNull();
        expect(result.current.givenName).toBeNull();
        expect(result.current.familyName).toBeNull();
    });

    it("sets error state and logs error when fetchAuthSession throws", async () => {
        mockUseAuthenticator.mockReturnValue({ authStatus: "authenticated" });
        mockFetchAuthSession.mockRejectedValue(new Error("Network error"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.groups).toBeUndefined();
        expect(result.current.email).toBeUndefined();
        expect(result.current.givenName).toBeUndefined();
        expect(result.current.familyName).toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith("Error fetching auth session:", expect.any(Error));
    });

});

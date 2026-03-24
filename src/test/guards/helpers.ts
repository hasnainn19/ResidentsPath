import { useAuth } from "../../hooks/useAuth";

type UseAuthReturn = ReturnType<typeof useAuth>;

/**
 * Creates a mockAuth helper bound to the given mocked useAuth function.
 * Accepts overrides to customise specific fields per test.
 * Defaults to an unauthenticated, non-loading state.
 */
export function createMockAuth(mockFn: { mockReturnValue: (val: UseAuthReturn) => void }) {
    return (overrides: Partial<UseAuthReturn> = {}) => {
        mockFn.mockReturnValue({
            status: "unauthenticated",
            isAuthenticated: false,
            isLoading: false,
            isStaff: false,
            isResident: false,
            isHounslowHouseDevice: false,
            groups: null,
            email: null,
            givenName: null,
            familyName: null,
            ...overrides,
        });
    };
}

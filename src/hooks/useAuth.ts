import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Normalises the raw `cognito:groups` claim from a JWT token payload into a string array.
 *
 * Cognito can return groups as an array (multiple groups) or a plain string (single group).
 * Both are normalised to `string[]`. Returns `null` if the value is absent or not a recognised type.
 */
function getTokenGroups(value: unknown): string[] | null {
    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
    }

    if (typeof value === "string" && value.trim().length) {
        return [value];
    }

    return null;
}

type AuthState =
    | { status: "loading" }
    | { status: "unauthenticated" }
    | { status: "authenticated"; groups: string[] | null; email: string | null; givenName: string | null; familyName: string | null }
    | { status: "error" }

/**
 * Custom hook that provides authentication state and user information from AWS Cognito.
 *
 * This hook centralizes all authentication logic, including:
 * - Checking if the user is authenticated
 * - Fetching the user's Cognito groups (e.g. "Staff", "Residents", "HounslowHouseDevices")
 * - Fetching the user's profile attributes (email, given name, family name)
 * - Managing loading states during auth checks
 *
 * Profile attributes (email, given name, family name) are read from the ID token.
 * Cognito group membership is read from the ID token where present, with a
 * fallback to the access token if the ID token does not carry a groups claim.
 *
 * A single AuthState value is used so all derived values update atomically
 * in the same render cycle, preventing stale intermediate states.
 */
export function useAuth() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

    useEffect(() => {
        const fetchUserGroups = async () => {

            if (authStatus === "configuring") {
                // Amplify is still initializing
                setAuthState({ status: "loading" });
                return;
            }

            // If the user is authenticated, fetch their Cognito data from the ID token
            if (authStatus === "authenticated") {
                try {
                    setAuthState({ status: "loading" });
                    const session = await fetchAuthSession();
                    const idToken = session.tokens?.idToken?.payload;
                    const accessToken = session.tokens?.accessToken?.payload;

                    // Runtime type guards are used instead of type assertions (as string)
                    // to ensure non-string payload values never violate the string | null contract
                    setAuthState({
                        status: "authenticated",
                        groups:
                            getTokenGroups(idToken?.["cognito:groups"]) ??
                            getTokenGroups(accessToken?.["cognito:groups"]),
                        email:
                            typeof idToken?.email === "string" ? idToken.email : null,
                        givenName:
                            typeof idToken?.given_name === "string" ? idToken.given_name : null,
                        familyName:
                            typeof idToken?.family_name === "string" ? idToken.family_name : null,
                    });
                }
                catch (error) {
                    console.error("Error fetching auth session:", error);
                    setAuthState({ status: "error" });
                }
            }
            // User is not authenticated
            else {
                setAuthState({ status: "unauthenticated" });
            }
        }

        fetchUserGroups();
    }, [authStatus]); // Run whenever authStatus changes

    const authenticated = authState.status === "authenticated";
    const groups = authenticated ? authState.groups : null;

    return {
        // Auth status
        status: authState.status,

        // Boolean flags
        isLoading: authState.status === "loading",
        isAuthenticated: authenticated,
        isStaff: Boolean(groups?.includes("Staff")),
        isResident: Boolean(groups?.includes("Residents")),
        isHounslowHouseDevice: Boolean(groups?.includes("HounslowHouseDevices")),

        // Raw data
        groups,
        email: authenticated ? authState.email : null,
        givenName: authenticated ? authState.givenName : null,
        familyName: authenticated ? authState.familyName : null,
    }
}

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

/**
 * Custom hook that provides authentication state and user information from AWS Cognito.
 *
 * This hook centralizes all authentication logic, including:
 * - Checking if the user is authenticated
 * - Fetching the user's Cognito groups (e.g. "Staff", "Residents", "HounslowHouseDevices")
 * - Fetching the user's profile attributes (email, given name, family name)
 * - Managing loading states during auth checks
 *
 * All data is read from the ID token, which contains both group membership
 * and user profile attributes.
 *
 * All values are derived from state so they all update together
 * in the same render cycle, preventing stale intermediate states.
 */
export function useAuth() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Initialised as undefined to indicate auth has not been configured yet
    const [groups, setGroups] = useState<string[] | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState<string | null | undefined>(undefined);
    const [givenName, setGivenName] = useState<string | null | undefined>(undefined);
    const [familyName, setFamilyName] = useState<string | null | undefined>(undefined);

    function setAuthenticatedState(groups: string[] | null, email: string | null, givenName: string | null, familyName: string | null) {
        setIsAuthenticated(true);
        setGroups(groups);
        setEmail(email);
        setGivenName(givenName);
        setFamilyName(familyName);
    }

    function setUnauthenticatedState() {
        setIsAuthenticated(false);
        setGroups(null);
        setEmail(null);
        setGivenName(null);
        setFamilyName(null);
    }

    function setErrorState() {
        setIsAuthenticated(false);
        setGroups(undefined);
        setEmail(undefined);
        setGivenName(undefined);
        setFamilyName(undefined);
    }

    useEffect(() => {
        const fetchUserGroups = async () => {

            if (authStatus === "configuring") {
                // Amplify is still initializing
                setIsLoading(true);
                return;
            }

            // If the user is authenticated, fetch their Cognito data from the ID token
            if (authStatus === "authenticated") {
                try {
                    setIsLoading(true);
                    const session = await fetchAuthSession();
                    const idToken = session.tokens?.idToken?.payload;
                    const accessToken = session.tokens?.accessToken?.payload;
                    const groups =
                        getTokenGroups(idToken?.["cognito:groups"]) ??
                        getTokenGroups(accessToken?.["cognito:groups"]);

                    setAuthenticatedState(
                        groups,
                        idToken?.email as string ?? null,
                        idToken?.given_name as string ?? null,
                        idToken?.family_name as string ?? null,
                    );
                }
                catch (error) {
                    console.error("Error fetching auth session:", error);
                    setErrorState();
                }
                finally {
                    setIsLoading(false);
                }
            }
            // User is not authenticated
            else {
                setUnauthenticatedState();
                setIsLoading(false);
            }
        }

        fetchUserGroups();
    }, [authStatus]); // Run whenever authStatus changes

    return {
        // Boolean flags
        isAuthenticated,
        isStaff: Boolean(groups?.includes("Staff")),
        isResident: Boolean(groups?.includes("Residents")),
        isHounslowHouseDevice: Boolean(groups?.includes("HounslowHouseDevices")),

        // Raw data
        groups,
        email,
        givenName,
        familyName,

        // Loading state
        isLoading,
    }

}

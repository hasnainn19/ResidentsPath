import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

/**
 * Custom hook that provides authentication state and user information from AWS Cognito.
 *
 * This hook centralizes all authentication logic, including:
 * - Checking if the user is authenticated
 * - Fetching the user's Cognito groups (e.g. "Staff", "Residents")
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
    const [groups, setGroups] = useState<string[] | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState<string | null | undefined>(undefined);
    const [givenName, setGivenName] = useState<string | null | undefined>(undefined);
    const [familyName, setFamilyName] = useState<string | null | undefined>(undefined);

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

                    // Extract groups, profile attributes from the ID token
                    setGroups(idToken?.["cognito:groups"] as string[] | undefined || null);
                    setEmail(idToken?.email as string | undefined || null);
                    setGivenName(idToken?.given_name as string | undefined || null);
                    setFamilyName(idToken?.family_name as string | undefined || null);
                    setIsAuthenticated(true);
                }
                catch (error) {
                    console.error("Error fetching auth session:", error);
                    setIsAuthenticated(false);
                    setGroups(undefined);
                    setEmail(undefined);
                    setGivenName(undefined);
                    setFamilyName(undefined);
                }
                finally {
                    setIsLoading(false);
                }
            }
            // User is not authenticated
            else {
                setIsAuthenticated(false);
                setGroups(null);
                setEmail(null);
                setGivenName(null);
                setFamilyName(null);
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

        // Raw data
        groups,
        email,
        givenName,
        familyName,

        // Loading state
        isLoading,
    }

}

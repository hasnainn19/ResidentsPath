import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

export function useAuth() {
    const { authStatus } = useAuthenticator((context) => [context.authStatus]);
    const [groups, setGroups] = useState<string[] | null | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [email, setEmail] = useState<string | null | undefined>(undefined);

    useEffect(() => {
        const fetchUserGroups = async () => {

            if (authStatus === "configuring") {
                // Amplify is still initializing
                setIsLoading(true);
                return;
            }

            // If the user is authenticated, fetch their Cognito groups
            if (authStatus === "authenticated") {
                try {
                    setIsLoading(true);
                    const session = await fetchAuthSession();

                    // Extract groups from JWT
                    const userGroups = session.tokens?.accessToken?.payload["cognito:groups"] as string[] | undefined;
                    setGroups(userGroups || null);

                    // Extract email 
                    const userEmail = session.tokens?.accessToken?.payload.email as string | undefined;
                    setEmail(userEmail || null);
                }
                catch (error) {
                    console.error("Error fetching auth session:", error);
                    setGroups(undefined);
                    setEmail(undefined);
                }
                finally {
                    setIsLoading(false);
                }
            }
            // User is not authenticated
            else {
                setGroups(null);
                setEmail(null);
                setIsLoading(false);
            }
        }

        fetchUserGroups();
    }, [authStatus]); // Run whenever authStatus changes

    // Return convenient helper values

    return {
        // Amplify auth status (e.g. "authenticated", "unauthenticated", "configuring")
        authStatus,

        // Boolean flags
        isAuthenticated: authStatus === "authenticated",
        isStaff: Boolean(groups?.includes("Staff")),
        isResident: Boolean(groups?.includes("Residents")),

        // Raw data
        groups,
        email,

        // Loading state
        isLoading,
    }

}
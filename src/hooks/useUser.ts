import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

type UserRecord = Schema["User"]["type"];

/**
 * Custom hook that provides the current authenticated user's DynamoDB User record.
 *
 * Subscribes to the User model via observeQuery, scoped automatically to the
 * current user by the ownerDefinedIn("id") auth rule (Cognito sub = User id).
 * Any update to the User record — whether from this client or another — is
 * propagated to all components that import this hook.
 *
 * Only runs for authenticated users. Returns null for guests or unauthenticated users.
 * For profile data about the authenticated Cognito session (groups, email from token)
 * use useAuth instead.
 *
 * @returns user - The User record, or null if unauthenticated or not yet loaded
 * @returns isLoading - True while auth is resolving or the initial fetch is in flight
 */
export function useUser() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const client = useMemo(() => generateClient<Schema>({ authMode: "userPool" }), []);
    const [user, setUser] = useState<UserRecord | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        const sub = client.models.User.observeQuery()
            .subscribe({
                next: ({ items }) => {
                    setUser(items[0] ?? null);
                    setIsLoading(false);
                },
            });

        return () => sub.unsubscribe();
    }, [client, isAuthenticated, authLoading]);

    return { user, isLoading };
}

import type { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";


interface RequireAuthProps {
    children: ReactNode;
}

/**
 * Route guard that requires the user to be authenticated to access the wrapped component.
 * If the user is not authenticated, they will be redirected to the /auth page.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Not authenticated - redirect to /auth with the current location in state for post-login redirect
    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Authenticated - render the protected page
    return <>{children}</>;
}
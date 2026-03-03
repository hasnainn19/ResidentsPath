import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

interface RequireRoleProps {
    allowedGroups: string[];
    children: ReactNode;
}

/**
 * Route guard that requires the user to be authenticated AND have one of the specified Cognito groups.
 *
 * If the user is not authenticated, they will be redirected to the /auth page.
 * If the user is authenticated but does not have the required role, they will see an Access Denied page.
 * 
 * @param allowedGroups - An array of Cognito group names that are allowed to access the wrapped component (e.g. ["Staff", "Residents"])
 * @param children - The component(s) to render if the user is authenticated and has the required role
 * @returns The wrapped component if access is granted, otherwise a redirect to /auth or shown an Access Denied page
 */
export default function RequireRole({ allowedGroups, children }: RequireRoleProps) {
    const { isAuthenticated, isLoading, groups } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Not authenticated - redirect to /auth with the current location in state for post-login redirect
    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Check if user has at least one of the allowed groups
    const hasRequiredRole = allowedGroups.some(group => groups?.includes(group));

    // Doesn't have the required role, show access denied
    if (!hasRequiredRole) {
        return <AccessDenied />;
    }

    // Authenticated and has required role - render the protected page
    return <>{children}</>;
}

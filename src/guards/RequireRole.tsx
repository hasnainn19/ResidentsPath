import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

interface RequireRoleProps {
    allowedGroups: string[]; // e,g ["Staff", "Residents"]
    children: ReactNode;
}

export default function RequireRole({ allowedGroups, children }: RequireRoleProps) {
    const { isAuthenticated, isLoading, groups } = useAuth();

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


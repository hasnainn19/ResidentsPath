import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

interface RequireGuestProps {
    children: ReactNode;
}

/**
 * Route guard that requires the user to be unauthenticated to access the wrapped component.
 *
 * If the user is authenticated as Staff, they will be redirected to /staff.
 * If the user is authenticated as a Resident, they will be redirected to /referencepage.
 * If the user is not authenticated, the wrapped component will be rendered.
 *
 * @param children - The component(s) to render if the user is not authenticated
 * @returns The wrapped component if unauthenticated, otherwise a redirect to the appropriate page
 */
export default function RequireGuest({ children }: RequireGuestProps) {
    const { isAuthenticated, isLoading, isStaff } = useAuth();

    // Show loading state while checking authentication
    if (isLoading) {
        return <LoadingSpinner />;
    }

    // If authenticated, redirect to appropriate dashboard based on role
    if (isAuthenticated) {
        if (isStaff) {
            return <Navigate to="/staff" replace />;
        }
        return <Navigate to="/referencepage" replace />;
    }

    // Not authenticated - render the wrapped component
    return <>{children}</>;
}
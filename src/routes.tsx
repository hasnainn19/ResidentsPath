import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import App from "./App";
import StaffDashboard from "./pages/StaffDashboard";
import BookingPage from "./pages/BookingPage";


export const router = createBrowserRouter([
    {
        path: "/", element: <LandingPage />
    },
    {
        path: "/auth", element: <AuthPage />
    },
    {
        path: "/resident/dashboard", element: <App />
    },
    {
        path: "/staff/dashboard", element: <StaffDashboard />
    },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);
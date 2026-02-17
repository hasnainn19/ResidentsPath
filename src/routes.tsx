import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import App from "./App";
import ReferencePage from "./pages/ReferencePage";
import BookingPage from "./pages/BookingPage";

export const router = createBrowserRouter([
    {
        path: "/", element:  <LandingPage />
    },
    {
        path: "/auth", element: <AuthPage />
    },
    {
        path: "/start", element: <App />
    },
    {
        path: "/referencepage", element: <ReferencePage />
    },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);
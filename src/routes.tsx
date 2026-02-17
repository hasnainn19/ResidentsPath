import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import App from "./App";
import BookingPage from "./pages/BookingPage";


export const router = createBrowserRouter([
    {
        path: "/", element: <LandingPage />
    },
    {
        path: "/login", element: <LoginPage />
    },
    {
        path: "/signup", element: <SignupPage />
    },
    {
        path: "/resident/dashboard", element: <App />
    },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);
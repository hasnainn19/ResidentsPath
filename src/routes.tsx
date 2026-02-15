import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import BookingPage from "./pages/BookingPage";


export const router = createBrowserRouter([
    {
        path: "/", element: <App /> 
    },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);
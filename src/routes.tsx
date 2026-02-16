import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import StaffDashboard from "./pages/StaffDashboard";
import StaffLayout from "./layouts/StaffLayout";
import BookingPage from "./pages/BookingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/bookingpage",
    element: <BookingPage />,
  },
  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      {
        index: true,
        element: <StaffDashboard />,
      },
    ],
  },
]);

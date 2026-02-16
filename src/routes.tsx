import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import BookingPage from "./pages/BookingPage";

import FormLayout from "./pages/Form/FormLayout";
import PersonalDetails from "./pages/Form/PersonalDetails";
import EnquirySelection from "./pages/Form/EnquirySelection";
import Step3 from "./pages/Form/ReviewAndSubmit";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },

  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <Navigate to="/form/personal-details" replace /> },
      { path: "personal-details", element: <PersonalDetails /> },
      { path: "enquiry-selection", element: <EnquirySelection /> },
      { path: "review-and-submit", element: <Step3 /> },
    ],
  },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);

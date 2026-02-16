import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import BookingPage from "./pages/BookingPage";

import FormLayout from "./pages/Form/FormLayout";
import PersonalDetails from "./pages/Form/PersonalDetails";
import EnquirySelection from "./pages/Form/EnquirySelection";
import ReviewAndSubmit from "./pages/Form/ReviewAndSubmit";
import Actions from "./pages/Form/Actions";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },

  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <Navigate to="/form/personal-details" replace /> },
      { path: "personal-details", element: <PersonalDetails /> },
      { path: "enquiry-selection", element: <EnquirySelection /> },
       {path: "actions", element: <Actions /> },
      { path: "review-and-submit", element: <ReviewAndSubmit /> },
    ],
  },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);

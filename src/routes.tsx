import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ReferencePage from "./pages/ReferencePage";
import BookingPage from "./pages/BookingPage";
import FormLayout from "./pages/Form/FormLayout";
import PersonalDetails from "./pages/Form/PersonalDetails";
import EnquirySelection from "./pages/Form/EnquirySelection";
import ReviewAndSubmit from "./pages/Form/ReviewAndSubmit";
import Actions from "./pages/Form/Actions";
import RequireFormSteps from "./pages/Form/components/RequireFormSteps";
import ResumeFromSave from "./pages/Form/components/ResumeFromSave";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },

  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <ResumeFromSave /> },
      { path: "personal-details", element: <PersonalDetails /> },
      {
        path: "enquiry-selection",
        element: (
          <RequireFormSteps step="enquiry-selection">
            <EnquirySelection />
          </RequireFormSteps>
        ),
      },
    {
        path: "actions",
        element: (
          <RequireFormSteps step="actions">
            <Actions />
          </RequireFormSteps>
        ),
      },
      {
        path: "review-and-submit",
        element: (
          <RequireFormSteps step="review-and-submit">
            <ReviewAndSubmit />
          </RequireFormSteps>
        ),
      },
    ],
  },
  {
    path: "/bookingpage",
    element: <BookingPage />,
  },
  {
    path: "/referencepage", element: <ReferencePage />
  },
]);

import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import App from "./App";
import StaffDashboard from "./pages/StaffDashboard";
import ReferencePage from "./pages/ReferencePage";
import BookingPage from "./pages/BookingPage";
import FormLayout from "./pages/Form/FormLayout";
import PersonalDetails from "./pages/Form/PersonalDetails";
import EnquirySelection from "./pages/Form/EnquirySelection";
import ReviewAndSubmit from "./pages/Form/ReviewAndSubmit";
import Actions from "./pages/Form/Actions";
import RequireFormSteps from "./components/FormPageComponents/RequireFormSteps";
import ResumeFromSave from "./components/FormPageComponents/ResumeFromSave";
import UserDashboard from "./pages/UserDashboard";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/start",
    element: <App />,
  },
  {
    path: "/referencepage",
    element: <ReferencePage />,
  },
  {
    path: "/bookingpage",
    element: <BookingPage />,
  },
  {
    path: "/staff/dashboard",
    element: <StaffDashboard />,
  },
  {
      path: "/userdashboard", element: <UserDashboard /> 
  },
  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <ResumeFromSave /> },
      {
        path: "personal-details",
        element: (
          <RequireFormSteps step="personal-details">
            <PersonalDetails />
          </RequireFormSteps>
        ),
      },
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
]);

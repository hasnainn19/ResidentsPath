import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import App from "./App";
import StaffDashboard from "./pages/StaffDashboard";
import StaffLayout from "./layouts/StaffLayout";
import ReferencePage from "./pages/ReferencePage";
import BookingPage from "./pages/BookingPage";
import FormLayout from "./pages/Form/FormLayout";
import FormEntry from "./pages/Form/FormEntry";
import PersonalDetails from "./pages/Form/PersonalDetails";
import EnquirySelection from "./pages/Form/EnquirySelection";
import ReviewAndSubmit from "./pages/Form/ReviewAndSubmit";
import SubmissionReceipt from "./pages/Form/SubmissionReceipt";
import Actions from "./pages/Form/Actions";
import RequireFormSteps from "./components/FormPageComponents/RequireFormSteps";
import ExistingCaseFollowUp from "./pages/Form/ExistingCaseFollowUp";
import UserDashboard from "./pages/UserDashboard/UserDashboard";
import StaffQueuePage from "./pages/StaffQueuePage";
import RequireGuest from "./guards/RequireGuest";
import RequireAuth from "./guards/RequireAuth";
import RequireRole from "./guards/RequireRole";
import CheckInConfirmation from "./pages/CheckInConfirmation";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <RequireGuest><AuthPage /></RequireGuest>,
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
    element: <RequireAuth><BookingPage /></RequireAuth>,
  },  
  {
    path: "/checkinpage",
    element: <CheckInConfirmation />,
  },
  {
    path: "/receipts",
    element: <SubmissionReceipt />,
  },
  {
    path: "/receipts/:referenceNumber",
    element: <SubmissionReceipt />,
  },
  {
    path: "/staff",
    element: <RequireRole allowedGroups={["Staff"]}><StaffLayout /></RequireRole>,
    children: [
      {
        index: true,
        element: <StaffDashboard />,
      },
      {
        path: "queues",
        element: <StaffQueuePage />,
      },
    ],
  },
  {
      path: "/userdashboard/:caseId",
      element: <UserDashboard /> 
  },
  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <FormEntry /> },
      {
        path: "existing",
        element: <ExistingCaseFollowUp />,
      },
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

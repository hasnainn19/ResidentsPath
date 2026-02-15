import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import StaffDashboard from "./pages/StaffDashboard";
import CaseManagementPage from "./pages/CaseManagement";
import StaffLayout from "./layouts/StaffLayout";
import StaffDirectoryPage from "./pages/StaffDirectoryPage";
import CaseHistory from "./pages/CaseHistory";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/staff",
    element: <StaffLayout />,
    children: [
      {
        index: true,
        element: <StaffDashboard />,
      },
      {
        path: "cases",
        element: <CaseManagementPage />,
      },
      {
        path: "directory",
        element: <StaffDirectoryPage />,
      },
      {
        path: "my-cases",
        element: <CaseHistory />,
      },
    ],
  },
]);

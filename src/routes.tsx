import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import BookingPage from "./pages/BookingPage";

import FormLayout from "./pages/Form/FormLayout";
import Step1 from "./pages/Form/Step1";
import Step2 from "./pages/Form/Step2";
import Step3 from "./pages/Form/Step3";

export const router = createBrowserRouter([
  { path: "/", element: <App /> },

  {
    path: "/form",
    element: <FormLayout />,
    children: [
      { index: true, element: <Navigate to="/form/step-1" replace /> },
      { path: "step-1", element: <Step1 /> },
      { path: "step-2", element: <Step2 /> },
      { path: "step-3", element: <Step3 /> },
    ],
  },
    {
        path: "/bookingpage", element: <BookingPage />
    }
]);

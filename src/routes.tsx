import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Step2 from "./pages/Form/Step2";

export const router = createBrowserRouter([
    {
        path: "/", element: <App /> 
    },
    {
        path: "/form/step-2", element: <Step2 /> 
    },
]);

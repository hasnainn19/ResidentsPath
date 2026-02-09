import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import ReferencePage from "./pages/ReferencePage";


export const router = createBrowserRouter([
    {
        path: "/", element: <App /> 
    },
    {
        path: "/reference", element: <ReferencePage />
    },
]);
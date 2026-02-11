import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import UserDashboard from "./pages/UserDashboard";


export const router = createBrowserRouter([
    {
        path: "/", element: <App /> 
    },
    {
        path: "/userdashboard", element: <UserDashboard /> 
    },
]);
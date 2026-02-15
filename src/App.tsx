import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import StaffDashboard from "./pages/StaffDashboard";
import CaseManagementPage from "./pages/CaseManagement";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <CaseManagementPage />
    </>
  );
}

export default App;

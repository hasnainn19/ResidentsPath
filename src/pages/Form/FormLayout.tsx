import { Outlet } from "react-router-dom";
import { FormWizardProvider } from "./context/FormWizardProvider";
import NavBar from "../../components/NavBar";

export default function FormLayout() {
  return (
    <FormWizardProvider>
      <NavBar />
      <Outlet />
    </FormWizardProvider>
  );
}

import { Outlet } from "react-router-dom";
import { FormWizardProvider } from "./context/FormWizardProvider";

export default function FormLayout() {
  return (
    <FormWizardProvider>
      <Outlet />
    </FormWizardProvider>
  );
}

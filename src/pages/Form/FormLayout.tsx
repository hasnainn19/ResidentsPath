/**
 * Shared wrapper for the form wizard pages.
 *
 * This component sits above the pages in the route tree so they can share the same form state.
 * It renders whichever step is active using <Outlet />.
 * It also renders the NavBar and any shared context/providers for the form.
 */


import { Outlet, useLocation } from "react-router-dom";
import { FormWizardProvider } from "./context/FormWizardProvider";
import NavBar from "../../components/NavBar";
import { useEffect } from "react";

export default function FormLayout() {
  const location = useLocation();

  // Stop any running TTS whenever the active form step changes.
  useEffect(() => {
    window.speechSynthesis.cancel();
  }, [location.pathname]);
  
  return (
    <FormWizardProvider>
      <NavBar />
      <Outlet />
    </FormWizardProvider>
  );
}

/**
 * RequireFormSteps
 *
 * Prevents users from navigating directly to later steps using the URL.
 * If the requested step is ahead of the current step, it redirects back.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Navigate } from "react-router-dom";

import { useFormWizard } from "../../context/FormWizardProvider";
import { getEnquirySelectionState } from "../../pages/Form/model/getEnquirySelectionState";
import { computeCanGoNext } from "../../pages/Form/model/enquirySelectionLogic";
import type { FormData } from "../../pages/Form/model/formFieldTypes";

type StepKey = "personal-details" | "enquiry-selection" | "actions" | "review-and-submit";

const STEP_ORDER: StepKey[] = ["enquiry-selection", "personal-details", "actions", "review-and-submit"];

function isStep1Complete(data: FormData) {
  const ctx = getEnquirySelectionState(data);
  const needsUrgentReason = data.urgent === "yes";
  return computeCanGoNext(data, ctx.hasEnoughToProceed, needsUrgentReason);
}

function isStep2Complete(data: FormData) {
  // Step 2 is always optional but requires step 1 to be complete
  return isStep1Complete(data); 
}

function isStep3Complete(data: FormData) {
  // Step 3 completion depends on proceed choice.
  if (data.proceed === "BOOK_APPOINTMENT") {
     const hasAppointmentDate =  
      typeof data.appointmentDateIso === "string" && data.appointmentDateIso.trim() !== "";  
    const hasAppointmentTime =  
      typeof data.appointmentTime === "string" && data.appointmentTime.trim() !== "";  

    return hasAppointmentDate && hasAppointmentTime;
  }
  return true;
}

function getMaxAllowedStep(data: FormData): StepKey {
  if (!isStep1Complete(data)) return "enquiry-selection";
  if (!isStep2Complete(data)) return "personal-details";
  if (!isStep3Complete(data)) return "actions";
  return "review-and-submit";
}

export default function RequireFormSteps(props: { step: StepKey; children: ReactNode }) {
  const { formData } = useFormWizard();

  const maxAllowed = useMemo(() => getMaxAllowedStep(formData), [formData]);
  const wantIndex = STEP_ORDER.indexOf(props.step);
  const maxIndex = STEP_ORDER.indexOf(maxAllowed);
  if (wantIndex > maxIndex) {
    return <Navigate to={`/form/${maxAllowed}`} replace />;
  }

  return <>{props.children}</>;
}

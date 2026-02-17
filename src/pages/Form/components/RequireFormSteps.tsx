/**
 * RequireFormSteps
 *
 * Prevents users from navigating directly to later steps using the URL.
 * If the requested step is ahead of the current step, it redirects back.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Navigate } from "react-router-dom";

import { useFormWizard } from "../context/FormWizardProvider";
import { getEnquiryContext } from "../model/enquiriesContext";
import { computeCanGoNext } from "../model/enquirySelectionLogic";
import type { FormData } from "../model/types";

type StepKey = "personal-details" | "enquiry-selection" | "actions" | "review-and-submit";

const STEP_ORDER: StepKey[] = ["personal-details", "enquiry-selection", "actions", "review-and-submit"];

function isStep1Complete() {
  return true;
}

function isStep2Complete(data: FormData) {
  const ctx = getEnquiryContext(data);
  const needsUrgentReason = data.urgent === "yes";
  return computeCanGoNext(data, ctx.hasEnoughToProceed, needsUrgentReason);
}

function isStep3Complete(data: FormData) {
  // Step 3 completion depends on proceed choice.
  if (data.proceed === "Schedule appointment") {
    return !!data.appointmentDateIso && data.appointmentTime.trim() !== "";
  }
  return true;
}

function getMaxAllowedStep(data: FormData): StepKey {
  if (!isStep1Complete()) return "personal-details";
  if (!isStep2Complete(data)) return "enquiry-selection";
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

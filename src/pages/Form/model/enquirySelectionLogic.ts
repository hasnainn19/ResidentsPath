/**
 * Helper rules used by the Enquiry Selection step.
 *
 * This keeps Enquiry Selection readable by moving shared rules into one place:
 * - Work out which enquiry options to show (including the General Services rules).
 * - Decide whether the user is allowed to continue.
 * - Clear answers that no longer make sense after changing an earlier choice, so old values do
 *   not carry over into a different path.
 */

import type { EnquiryItem, FormData, Proceed, Urgency } from "./formFieldTypes";
import {
  ENQUIRIES_BY_GENERAL_SERVICES_SECTION,
  ENQUIRIES_BY_TOPLEVEL,
  GENERAL_SERVICES_DIRECT_ITEMS,
} from "../data/enquiries";

// Given the current FormData, this builds a simple context object used in multiple steps to decide:
// - Which enquiry is currently selected, and whether it has a "more detail" dropdown.
// - Whether the current selection is complete enough to move forward.
// - Which follow up sections should appear (children, disability/sensory, household size,
//   domestic abuse).
export function getEnquiryOptions(topLevel: string, choice: string): EnquiryItem[] {
  if (!topLevel) return [];

  if (topLevel !== "GeneralServices") {
    return ENQUIRIES_BY_TOPLEVEL[topLevel] || [];
  }

  if (!choice) return [];

  if (choice.startsWith("section:")) {
    const sectionId = choice.replace("section:", "");
    return ENQUIRIES_BY_GENERAL_SERVICES_SECTION[sectionId] || [];
  }

  if (choice.startsWith("direct:")) {
    const id = choice.replace("direct:", "");
    return GENERAL_SERVICES_DIRECT_ITEMS.filter((x) => x.value === id);
  }

  return [];
}

export function computeCanGoNext(data: FormData, hasEnoughToProceed: boolean, needsUrgentReason: boolean) {
  if (!hasEnoughToProceed) return false;
  if (data.proceed === "") return false;
  if (needsUrgentReason && data.urgentReason === "") return false;
  if (needsUrgentReason && data.urgentReason === "Other" && data.urgentOtherReason.trim() === "") return false;
  return true;
}

export function resetFormInfo(prev: FormData): FormData {
  return {
    ...prev,
    enquiryId: "",
    specificDetailId: "",
    routedDepartment: "",
    otherEnquiryText: "",

    householdSize: "",

    hasChildren: false,
    childrenCount: "0",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    ageRange: "",

    domesticAbuse: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    appointmentDateIso: "",
    appointmentTime: "",
  };
}

export function applyTopLevelChange(prev: FormData, nextTopLevel: string): FormData {
  const next = resetFormInfo({
    ...prev,
    topLevel: nextTopLevel,
    generalServicesChoice: "",
  });

  if (nextTopLevel === "Other") {
    return { ...next, routedDepartment: "General customer services" };
  }

  return next;
}

export function applyGeneralServicesChoiceChange(prev: FormData, nextChoice: string): FormData {
  const nextState = resetFormInfo({ ...prev, generalServicesChoice: nextChoice });

  // "direct:" options map straight to an enquiry (skip the extra enquiry dropdown)
  if (nextChoice.startsWith("direct:")) {
    const id = nextChoice.replace("direct:", "");
    const match = GENERAL_SERVICES_DIRECT_ITEMS.find((x) => x.value === id);

    return {
      ...nextState,
      enquiryId: id,
      routedDepartment: match?.department ?? "",
    };
  }

  // Section choices do not map directly to an enquiry, so just reset the enquiry fields and show the dropdown
  return nextState;
}

// Wipe follow up answers when enquiry changes
export function applyEnquiryChange(prev: FormData, nextId: string, enquiryOptions: EnquiryItem[]): FormData {
  const match = enquiryOptions.find((x) => x.value === nextId) || null;

  return {
    ...prev,
    enquiryId: nextId,
    specificDetailId: "",
    routedDepartment: match?.department ?? "",

    householdSize: "",

    hasChildren: false,
    childrenCount: "0",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    ageRange: "",

    domesticAbuse: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    appointmentDateIso: "",
    appointmentTime: "",
  };
}

// Clear urgent details when urgency is not "yes"
export function applyUrgencyChange(prev: FormData, value: Urgency): FormData {
  return {
    ...prev,
    urgent: value,
    urgentReason: value === "yes" ? prev.urgentReason : "",
    urgentOtherReason: value === "yes" ? prev.urgentOtherReason : "",
  };
}

export function applyProceedChange(prev: FormData, next: Proceed): FormData {
  return { ...prev, proceed: next, appointmentDateIso: "", appointmentTime: "" };
}

export function shouldShowSupportNotes(data: FormData) {
  return (
    data.needsAccessibility ||
    data.needsLanguage ||
    data.needsSeating ||
    data.needsWrittenUpdates ||
    data.needsLargeText ||
    data.needsQuietSpace ||
    data.needsBSL ||
    data.needsHelpWithForms ||
    (data.otherSupport ?? "").trim() !== "" ||
    (data.supportNotes ?? "").trim() !== ""
  );
}

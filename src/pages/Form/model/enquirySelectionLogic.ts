/**
 * Helper rules used by the Enquiry Selection step.
 *
 * This keeps Enquiry Selection readable by moving shared rules into one place:
 * - Work out which enquiry options to show.
 * - Decide whether the user is allowed to continue.
 * - Clear answers that no longer make sense after changing an earlier choice, so old values do
 *   not carry over into a different path.
 */

import type { EnquiryItem, FormData, Proceed, Urgency } from "./formFieldTypes";
import { ENQUIRIES_BY_TOPLEVEL } from "../data/enquiries";

// Given the current FormData, this builds a simple context object used in multiple steps to decide:
// - Which enquiry is currently selected, and whether it has a "more detail" dropdown.
// - Whether the current selection is complete enough to move forward.
// - Which follow up sections should appear (children, disability/sensory, household size,
//   domestic abuse).
export function getEnquiryOptions(topLevel: string): EnquiryItem[] {
  if (!topLevel) return [];
  return ENQUIRIES_BY_TOPLEVEL[topLevel] || [];
}

export function computeCanGoNext(
  data: FormData,
  hasEnoughToProceed: boolean,
  needsUrgentReason: boolean,
) {
  if (!hasEnoughToProceed) return false;
  if (data.proceed === "") return false;
  if (needsUrgentReason) {
    const r = data.urgentReason;
    if (r === "") return false;
    if (r === "OTHER") {
      const details = (data.urgentReasonOtherText || "").trim();
      if (!details) return false;
    }
  }
  return true;
}

export function resetFormInfo(prev: FormData): FormData {
  return {
    ...prev,
    enquiryId: "",
    specificDetailId: "",
    routedDepartment: "",

    householdSize: "",

    hasChildren: false,
    childrenCount: "",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    ageRange: "",

    domesticAbuse: false,
    safeToContact: "PREFER_NOT_TO_SAY",
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

  if (nextTopLevel !== "") {
    const options = ENQUIRIES_BY_TOPLEVEL[nextTopLevel] || [];
    if (options.length === 1) {
      const only = options[0];
      return {
        ...next,
        enquiryId: only.value,
        routedDepartment: only.department ?? "",
      };
    }
  }

  return next;
}

// Wipe follow up answers when enquiry changes
export function applyEnquiryChange(
  prev: FormData,
  nextId: string,
  enquiryOptions: EnquiryItem[],
): FormData {
  const match = enquiryOptions.find((x) => x.value === nextId) || null;

  return {
    ...prev,
    enquiryId: nextId,
    specificDetailId: "",
    routedDepartment: match?.department ?? "",

    householdSize: "",

    hasChildren: false,
    childrenCount: "",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    ageRange: "",

    domesticAbuse: false,
    safeToContact: "PREFER_NOT_TO_SAY",
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
    urgentReasonOtherText: value === "yes" ? prev.urgentReasonOtherText : "",
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

import type { EnquiryItem, FormData } from "./types";
import { ENQUIRIES_BY_GENERAL_SERVICES_SECTION, ENQUIRIES_BY_TOPLEVEL, GENERAL_SERVICES_DIRECT_ITEMS } from "../data/enquiries";

export const DISABILITY_SUPPORT_RESET = {
  needsSeating: false,
  needsWrittenUpdates: false,
  needsLargeText: false,
  needsQuietSpace: false,
  needsBSL: false,
  needsHelpWithForms: false,
  otherSupport: "",
};

export const ALL_SUPPORT_RESET = {
  needsAccessibility: false,
  needsLanguage: false,
  ...DISABILITY_SUPPORT_RESET,
};

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
  if (data.contactMethod === "") return false;
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

    householdSize: "",

    hasChildren: false,
    childrenCount: "1",

    hasDisabilityOrSensory: false,
    disabilityType: "",

    domesticAbuse: false,
    safeToContact: "prefer_not_to_say",
    safeContactNotes: "",

    ...DISABILITY_SUPPORT_RESET,
  };
}

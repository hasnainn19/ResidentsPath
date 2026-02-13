import type { FormData } from "./types";

export const initialFormData: FormData = {
  language: "en",

  topLevel: "",
  generalServicesChoice: "",

  enquiryId: "",
  specificDetailId: "",
  routedDepartment: "",

  hasChildren: false,
  childrenCount: "1",

  hasDisabilityOrSensory: false,
  disabilityType: "",

  householdSize: "",

  domesticAbuse: false,
  safeToContact: "prefer_not_to_say",
  safeContactNotes: "",

  urgent: "unsure",
  urgentReason: "",
  urgentOtherReason: "",

  additionalInfo: "",

  proceed: "",

  needsAccessibility: false,
  needsLanguage: false,

  needsSeating: false,
  needsWrittenUpdates: false,
  needsLargeText: false,
  needsQuietSpace: false,
  needsBSL: false,
  needsHelpWithForms: false,
  otherSupport: "",

  contactMethod: "",
};

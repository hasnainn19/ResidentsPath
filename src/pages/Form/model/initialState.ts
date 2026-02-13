import type { FormData } from "./types";

export const initialFormData: FormData = {
  language: "en",

  provideDetails: "yes",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: null,

  topLevel: "",
  generalServicesChoice: "",

  enquiryId: "",
  specificDetailId: "",
  routedDepartment: "",

  hasChildren: false,
  childrenCount: "0",

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

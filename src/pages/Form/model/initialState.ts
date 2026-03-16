/**
 * Default values for a new form.
 *
 * Exports the initial FormData object so every field has a predictable starting value
 *
 * Any new FormData field should get a default here.
 */

import type { FormData } from "./formFieldTypes";

export const initialFormData: FormData = {
  language: "en",
  privacyNoticeAccepted: false,

  provideDetails: "yes",
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  email: "",
  phoneCountry: "GB",
  phone: "",
  dob: "",

  addressLine1: "",
  addressLine2: "",
  addressLine3: "",
  townOrCity: "",
  postcode: "",

  pronouns: "",
  pronounsOtherText: "",

  topLevel: "",
  generalServicesChoice: "",

  enquiryId: "",
  specificDetailId: "",
  routedDepartment: "",

  hasChildren: false,
  childrenCount: "",

  hasDisabilityOrSensory: false,
  disabilityType: "",

  householdSize: "",

  domesticAbuse: false,
  safeToContact: "PREFER_NOT_TO_SAY",
  safeContactNotes: "",

  ageRange: "",

  urgent: "unsure",
  urgentReason: "",
  urgentReasonOtherText: "",

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
  supportNotes: "",
  otherSupport: "",

  contactMethod: "",

  appointmentDateIso: "",
  appointmentTime: "",
};

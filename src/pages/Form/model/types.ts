/**
 * Types used by the form.
 *
 * This defines FormData and the allowed values for key fields like urgency, proceed choice, and routing department. 
 * This allows the same types to be shared across the form steps.
 *
 * If a field is added/removed, this file should usually be updated first, then initialState
 * and any review/validation logic that depends on it.
 */


export type Urgency = "yes" | "no" | "unsure";
export type SafeToContact = "yes" | "no" | "prefer_not_to_say";

export type Proceed = "" | "Join digital queue" | "Schedule appointment" | "Request callback";
export type ContactMethod = "" | "Text message" | "Phone call" | "Email" | "Letter";

export type Count = "0" | "1" | "2" | "3" | "4" | "5" | "6+";
export type HouseholdSize = "" | "1" | "2" | "3" | "4" | "5" | "6+" | "Prefer not to say";

export type DisabilityType =
  | ""
  | "Mobility impairment"
  | "Visual impairment"
  | "Hearing impairment"
  | "Cognitive / learning"
  | "Mental health"
  | "Other"
  | "Prefer not to say";

export type Department =
  | "Council Tax or Housing Benefit Help"
  | "Homelessness"
  | "Adults duty"
  | "Childrens duty"
  | "Community Hub Advisor"
  | "General customer services";

export type SpecificOption = { value: string; label: string };

export type EnquiryItem = {
  value: string;
  label: string;
  department: Department;
  specifics?: SpecificOption[];

  askChildrenQs?: boolean;
  askVulnerabilityQs?: boolean;
  askHouseholdSize?: boolean;
  askDomesticAbuseQs?: boolean;
  askAgeQs?: boolean;
};

export type LanguageOption = { code: string; label: string };

export type YesNo = "yes" | "no";

export type ageRange = 
  | ""
  | "Under 18"
  | "18-24"
  | "25-34"
  | "35-44"
  | "45-54"
  | "55-64"
  | "65+"
  | "Prefer not to say";

export type FormData = {
  language: string;

  provideDetails: YesNo;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountry: string;
  phoneType: "" | "Mobile" | "Home phone";
  phone: string;
  dob: string | null;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  townOrCity: string;
  postcode: string;

  topLevel: string;
  generalServicesChoice: string;

  enquiryId: string;
  specificDetailId: string;
  routedDepartment: "" | Department;

  hasChildren: boolean;
  childrenCount: Count;

  hasDisabilityOrSensory: boolean;
  disabilityType: DisabilityType;

  householdSize: HouseholdSize;

  domesticAbuse: boolean;
  safeToContact: SafeToContact;
  safeContactNotes: string;

  ageRange: ageRange;

  urgent: Urgency;
  urgentReason: string;
  urgentOtherReason: string;

  additionalInfo: string;

  proceed: Proceed;

  needsAccessibility: boolean;
  needsLanguage: boolean;
  
  needsSeating: boolean;
  needsWrittenUpdates: boolean;
  needsLargeText: boolean;
  needsQuietSpace: boolean;
  needsBSL: boolean;
  needsHelpWithForms: boolean;
  otherSupport: string;

  contactMethod: ContactMethod;
};

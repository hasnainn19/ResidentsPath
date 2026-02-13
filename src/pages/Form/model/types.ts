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
};

export type LanguageOption = { code: string; label: string };

export type YesNo = "yes" | "no";

export type FormData = {
  language: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string | null;

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

/**
 * Types used by the form.
 *
 * This defines FormData and the allowed values for key fields like urgency, proceed choice, and routing department.
 * This allows the same types to be shared across the form steps.
 *
 * If a field is added/removed, this file should usually be updated first, then initialState
 * and any review/validation logic that depends on it.
 */

import type { DepartmentId, formInput } from "../../../../shared/formSchema";

// Enums used in form stored in formSchema to reduce duplication
export type Urgency = NonNullable<formInput["urgent"]>;

export type UrgentReason = "" | NonNullable<formInput["urgentReason"]>;

export type SafeToContact = NonNullable<formInput["safeToContact"]>;

export type Proceed = "" | formInput["proceed"];
export type ContactMethod = "" | NonNullable<formInput["contactMethod"]>;

export type Count = "" | NonNullable<formInput["childrenCount"]>;

export type HouseholdSize = "" | NonNullable<formInput["householdSize"]>;

export type DisabilityType = "" | NonNullable<formInput["disabilityType"]>;

export type SpecificOption = { value: string; label: string };

export type SelfServiceLink = { label: string; href: string };

export type EnquiryItem = {
  value: string;
  label: string;
  department: DepartmentId;
  specifics?: SpecificOption[];
  selfServiceLinks?: SelfServiceLink[];

  askChildrenQs?: boolean;
  askVulnerabilityQs?: boolean;
  askHouseholdSize?: boolean;
  askDomesticAbuseQs?: boolean;
  askAgeQs?: boolean;
};

export type LanguageOption = { code: string; label: string };

export type YesNo = "yes" | "no";

export type AgeRange = "" | NonNullable<formInput["ageRange"]>;

export type PronounsOption = "" | NonNullable<formInput["pronouns"]>;

export type FormData = {
  language: string;

  provideDetails: YesNo;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phoneCountry: string;
  phone: string;
  dob: string;

  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  townOrCity: string;
  postcode: string;

  pronouns: PronounsOption;
  pronounsOtherText: string;

  topLevel: string;
  generalServicesChoice: string;

  enquiryId: string;
  specificDetailId: string;
  routedDepartment: "" | DepartmentId;
  otherEnquiryText: string;

  hasChildren: boolean;
  childrenCount: Count;

  hasDisabilityOrSensory: boolean;
  disabilityType: DisabilityType;

  householdSize: HouseholdSize;

  domesticAbuse: boolean;
  safeToContact: SafeToContact;
  safeContactNotes: string;

  ageRange: AgeRange;

  urgent: Urgency;
  urgentReason: UrgentReason;
  urgentReasonOtherText: string;

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
  supportNotes: string;
  otherSupport: string;

  contactMethod: ContactMethod;

  appointmentDateIso: string;
  appointmentTime: string;
};

export type BusyLevel = "quiet" | "average" | "busy" | "veryBusy";

export type QueueStatus = {
  typicalWaitMin: number;
  typicalWaitMax: number;
  updatedAtIso: string;
};

export type OptionTileProps = {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

import type { Department, FormData } from "./formFieldTypes";
import { getEnquirySelectionState } from "./getEnquirySelectionState";

type DepartmentBackend =
  | "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP"
  | "HOMELESSNESS"
  | "ADULTS_DUTY"
  | "CHILDRENS_DUTY"
  | "COMMUNITY_HUB_ADVISOR"
  | "GENERAL_CUSTOMER_SERVICES";

type ProceedBackend = "BOOK_APPOINTMENT" | "JOIN_DIGITAL_QUEUE";

type PronounsBackend = "" | "HE_HIM" | "SHE_HER" | "THEY_THEM" | "OTHER" | "PREFER_NOT_TO_SAY";

type UrgentBackend = "yes" | "no" | "unsure";

type UrgentReasonBackend =
  | "SAFETY_CONCERN"
  | "NO_SAFE_PLACE_TO_STAY_TONIGHT"
  | "HEALTH_OR_MOBILITY"
  | "TIME_LIMITED_TODAY";

type SafeToContactBackend = "yes" | "no" | "prefer_not_to_say";

type ContactMethodBackend = "TEXT_MESSAGE" | "EMAIL";

type SupportNeedBackend =
  | "ACCESSIBILITY"
  | "LANGUAGE"
  | "INTERPRETER"
  | "SEATING"
  | "WRITTEN_UPDATES"
  | "LARGE_TEXT"
  | "QUIET_SPACE"
  | "BSL"
  | "HELP_WITH_FORMS";

export type SubmitEnquiryInput = {
  department: DepartmentBackend;
  enquiry: string;
  proceed: ProceedBackend;

  appointmentDateIso?: string;
  appointmentTime?: string;

  firstName?: string;
  middleName?: string;
  lastName?: string;
  preferredName?: string;

  email?: string;
  phoneCountry?: string;
  phone?: string;

  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  townOrCity?: string;
  postcode?: string;

  pronouns?: PronounsBackend;
  pronounsOther?: string;

  childrenCount?: FormData["childrenCount"];
  hasDisabilityOrSensory?: boolean;
  disabilityType?:
    | ""
    | "MOBILITY_IMPAIRMENT"
    | "VISUAL_IMPAIRMENT"
    | "HEARING_IMPAIRMENT"
    | "COGNITIVE_LEARNING"
    | "MENTAL_HEALTH"
    | "OTHER"
    | "PREFER_NOT_TO_SAY";
  householdSize?: "" | "1" | "2" | "3" | "4" | "5" | "6+" | "PREFER_NOT_TO_SAY";
  domesticAbuse?: boolean;
  safeToContact?: SafeToContactBackend;
  safeContactNotes?: string;
  ageRange?:
    | ""
    | "UNDER_18"
    | "AGE_18_24"
    | "AGE_25_34"
    | "AGE_35_44"
    | "AGE_45_54"
    | "AGE_55_64"
    | "AGE_65_PLUS"
    | "PREFER_NOT_TO_SAY";

  urgent?: UrgentBackend;
  urgentReason?: UrgentReasonBackend;
  urgentOtherReason?: string;

  additionalInfo?: string;

  supportNeeds?: SupportNeedBackend[];
  supportNotes?: string;
  otherSupport?: string;

  contactMethod?: ContactMethodBackend;
};

function trimOrUndef(s: string): string | undefined {
  const t = s.trim();
  return t.length ? t : undefined;
}

const DEPARTMENT_TO_BACKEND: Record<Department, DepartmentBackend> = {
  "Council Tax or Housing Benefit Help": "COUNCIL_TAX_OR_HOUSING_BENEFIT_HELP",
  Homelessness: "HOMELESSNESS",
  "Adults duty": "ADULTS_DUTY",
  "Childrens duty": "CHILDRENS_DUTY",
  "Community Hub Advisor": "COMMUNITY_HUB_ADVISOR",
  "General customer services": "GENERAL_CUSTOMER_SERVICES",
};

function getProceedBackend(proceed: FormData["proceed"]): ProceedBackend {
  if (proceed === "Schedule appointment") return "BOOK_APPOINTMENT";
  return "JOIN_DIGITAL_QUEUE";
}

function getPronounsBackend(pronouns: FormData["pronouns"]): PronounsBackend | undefined {
  if (pronouns === "") return undefined;
  if (pronouns === "Use my name only") return "";
  if (pronouns === "He/him") return "HE_HIM";
  if (pronouns === "She/her") return "SHE_HER";
  if (pronouns === "They/them") return "THEY_THEM";
  if (pronouns === "Other") return "OTHER";
  return "PREFER_NOT_TO_SAY";
}

function getDisabilityTypeBackend(
  disabilityType: FormData["disabilityType"],
): SubmitEnquiryInput["disabilityType"] | undefined {
  if (disabilityType === "") return undefined;
  if (disabilityType === "Mobility impairment") return "MOBILITY_IMPAIRMENT";
  if (disabilityType === "Visual impairment") return "VISUAL_IMPAIRMENT";
  if (disabilityType === "Hearing impairment") return "HEARING_IMPAIRMENT";
  if (disabilityType === "Cognitive / learning") return "COGNITIVE_LEARNING";
  if (disabilityType === "Mental health") return "MENTAL_HEALTH";
  if (disabilityType === "Other") return "OTHER";
  return "PREFER_NOT_TO_SAY";
}

function getHouseholdSizeBackend(
  householdSize: FormData["householdSize"],
): SubmitEnquiryInput["householdSize"] | undefined {
  if (householdSize === "") return undefined;
  if (householdSize === "Prefer not to say") return "PREFER_NOT_TO_SAY";
  return householdSize;
}

function getAgeRangeBackend(ageRange: FormData["ageRange"]): SubmitEnquiryInput["ageRange"] | undefined {
  if (ageRange === "") return undefined;
  if (ageRange === "Under 18") return "UNDER_18";
  if (ageRange === "18-24") return "AGE_18_24";
  if (ageRange === "25-34") return "AGE_25_34";
  if (ageRange === "35-44") return "AGE_35_44";
  if (ageRange === "45-54") return "AGE_45_54";
  if (ageRange === "55-64") return "AGE_55_64";
  if (ageRange === "65+") return "AGE_65_PLUS";
  return "PREFER_NOT_TO_SAY";
}

function getUrgentReasonBackend(urgentReason: string): UrgentReasonBackend | undefined {
  const t = trimOrUndef(urgentReason);
  if (!t) return undefined;
  if (t === "Safety concern") return "SAFETY_CONCERN";
  if (t === "No safe place to stay tonight") return "NO_SAFE_PLACE_TO_STAY_TONIGHT";
  if (t === "Health or mobility") return "HEALTH_OR_MOBILITY";
  if (t === "Time-limited today") return "TIME_LIMITED_TODAY";
  return undefined;
}

function getContactMethodBackend(contactMethod: FormData["contactMethod"]): ContactMethodBackend | undefined {
  if (contactMethod === "") return undefined;
  if (contactMethod === "Text message") return "TEXT_MESSAGE";
  return "EMAIL";
}

function getSupportNeedsArray(data: FormData): SupportNeedBackend[] | undefined {
  const needs: SupportNeedBackend[] = [];

  if (data.needsAccessibility) needs.push("ACCESSIBILITY");
  if (data.needsLanguage) needs.push("LANGUAGE");
  if (data.needsSeating) needs.push("SEATING");
  if (data.needsWrittenUpdates) needs.push("WRITTEN_UPDATES");
  if (data.needsLargeText) needs.push("LARGE_TEXT");
  if (data.needsQuietSpace) needs.push("QUIET_SPACE");
  if (data.needsBSL) needs.push("BSL");
  if (data.needsHelpWithForms) needs.push("HELP_WITH_FORMS");

  if (!needs.length) return undefined;
  return Array.from(new Set(needs));
}

export function buildSubmitEnquiryPayload(data: FormData): SubmitEnquiryInput {
  const sel = getEnquirySelectionState(data);

  const departmentLabel = (data.routedDepartment || sel.selectedEnquiry?.department) as Department;
  const enquiry = sel.isOther ? data.otherEnquiryText : data.enquiryId;

  const payload: SubmitEnquiryInput = {
    department: DEPARTMENT_TO_BACKEND[departmentLabel],
    enquiry,
    proceed: getProceedBackend(data.proceed),

    appointmentDateIso: data.proceed === "Schedule appointment" ? trimOrUndef(data.appointmentDateIso) : undefined,
    appointmentTime: data.proceed === "Schedule appointment" ? trimOrUndef(data.appointmentTime) : undefined,

    firstName: trimOrUndef(data.firstName),
    middleName: trimOrUndef(data.middleName),
    lastName: trimOrUndef(data.lastName),
    preferredName: trimOrUndef(data.preferredName),

    email: trimOrUndef(data.email),
    phoneCountry: trimOrUndef(data.phoneCountry),
    phone: trimOrUndef(data.phone),

    addressLine1: trimOrUndef(data.addressLine1),
    addressLine2: trimOrUndef(data.addressLine2),
    addressLine3: trimOrUndef(data.addressLine3),
    townOrCity: trimOrUndef(data.townOrCity),
    postcode: trimOrUndef(data.postcode),

    pronouns: getPronounsBackend(data.pronouns),
    pronounsOther: trimOrUndef(data.pronounsOther),

    childrenCount: sel.showChildrenQs && data.hasChildren ? data.childrenCount : undefined,
    hasDisabilityOrSensory: sel.showDisabilityQs ? data.hasDisabilityOrSensory : undefined,
    disabilityType:
      sel.showDisabilityQs && data.hasDisabilityOrSensory ? getDisabilityTypeBackend(data.disabilityType) : undefined,
    householdSize: sel.showHouseholdSize ? getHouseholdSizeBackend(data.householdSize) : undefined,
    domesticAbuse: sel.showDomesticAbuseQs ? data.domesticAbuse : undefined,
    safeToContact: sel.showDomesticAbuseQs && data.domesticAbuse ? data.safeToContact : undefined,
    safeContactNotes:
      sel.showDomesticAbuseQs && data.domesticAbuse && data.safeToContact === "no"
        ? trimOrUndef(data.safeContactNotes)
        : undefined,
    ageRange: sel.showAgeRange ? getAgeRangeBackend(data.ageRange) : undefined,

    urgentReason: getUrgentReasonBackend(data.urgentReason),
    urgentOtherReason: trimOrUndef(data.urgentOtherReason),

    additionalInfo: trimOrUndef(data.additionalInfo),

    supportNeeds: getSupportNeedsArray(data),
    supportNotes: trimOrUndef(data.supportNotes),
    otherSupport: trimOrUndef(data.otherSupport),

    contactMethod: getContactMethodBackend(data.contactMethod),
  };

  for (const k of Object.keys(payload) as Array<keyof SubmitEnquiryInput>) {
    if (payload[k] === undefined) delete payload[k];
  }

  return payload;
}
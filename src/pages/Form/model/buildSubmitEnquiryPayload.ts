/**
 * Builds the payload to submit an enquiry, removing any fields that are empty or not relevant for the backend
 */

import dayjs from "dayjs";
import type { FormData } from "./formFieldTypes";
import { getEnquirySelectionState } from "./getEnquirySelectionState";
import { normalisePhoneToE164, type formInput } from "../../../../shared/formSchema";

type SupportNeeds = NonNullable<NonNullable<formInput["supportNeeds"]>[number]>;
type AgeRangeValue = NonNullable<formInput["ageRange"]>;

// Trims a string and returns undefined if it's empty after trimming
function trimOrUndef(s: string): string | undefined {
  const t = s.trim();
  return t.length ? t : undefined;
}

function optionalValue<T extends string>(value: "" | T | undefined): T | undefined {
  if (value === "" || value === undefined) return undefined;
  return value;
}

function getProceedBackend(proceed: FormData["proceed"]): formInput["proceed"] {
  if (proceed === "") throw new Error("proceed is required");
  return proceed;
}

function getSupportNeedsArray(data: FormData): SupportNeeds[] | undefined {
  const needs: SupportNeeds[] = [];

  if (data.needsAccessibility) needs.push("ACCESSIBILITY");
  if (data.needsLanguage) needs.push("LANGUAGE");
  if (data.needsSeating) needs.push("SEATING");
  if (data.needsWrittenUpdates) needs.push("WRITTEN_UPDATES");
  if (data.needsLargeText) needs.push("LARGE_TEXT");
  if (data.needsQuietSpace) needs.push("QUIET_SPACE");
  if (data.needsBSL) needs.push("BSL");
  if (data.needsHelpWithForms) needs.push("HELP_WITH_FORMS");

  return needs.length ? needs : undefined;
}

function getAgeRangeFromDob(dob: string): AgeRangeValue | undefined {
  const birthDate = dayjs(dob);

  if (!birthDate.isValid()) return undefined;

  const today = dayjs();
  let age = today.year() - birthDate.year();

  if (
    today.month() < birthDate.month() ||
    (today.month() === birthDate.month() && today.date() < birthDate.date())
  ) {
    age -= 1;
  }

  if (age < 0) return undefined;
  if (age < 18) return "UNDER_18";
  if (age <= 24) return "AGE_18_24";
  if (age <= 34) return "AGE_25_34";
  if (age <= 44) return "AGE_35_44";
  if (age <= 54) return "AGE_45_54";
  if (age <= 64) return "AGE_55_64";
  return "AGE_65_PLUS";
}

// Build the payload, removing any fields that are empty or not relevant for the backend
export function buildSubmitEnquiryPayload(data: FormData): formInput {
  const sel = getEnquirySelectionState(data);

  const departmentId = data.routedDepartment || sel.selectedEnquiry?.department;
  if (!departmentId) throw new Error("Unknown department");

  const proceed = getProceedBackend(data.proceed);

  const contactMethod = optionalValue(data.contactMethod);
  const phoneCountry = trimOrUndef(data.phoneCountry);
  const phone = trimOrUndef(data.phone);
  const dob = data.provideDetails === "yes" ? trimOrUndef(data.dob) : undefined;
  const ageRange =
    optionalValue(data.ageRange) ??
    (sel.selectedEnquiry?.askAgeQs === true && dob ? getAgeRangeFromDob(dob) : undefined);

  const safeToContact =
    sel.showDomesticAbuseQs && data.domesticAbuse ? optionalValue(data.safeToContact) : undefined;

  const payload: formInput = {
    departmentId,
    enquiry: data.enquiryId,
    proceed,

    dob,

    appointmentDateIso:
      proceed === "BOOK_APPOINTMENT" ? trimOrUndef(data.appointmentDateIso) : undefined,
    appointmentTime: proceed === "BOOK_APPOINTMENT" ? trimOrUndef(data.appointmentTime) : undefined,

    firstName: trimOrUndef(data.firstName),
    middleName: trimOrUndef(data.middleName),
    lastName: trimOrUndef(data.lastName),
    preferredName: trimOrUndef(data.preferredName),

    email: trimOrUndef(data.email),
    phoneCountry,
    phone: phone ? normalisePhoneToE164(phone, phoneCountry) ?? phone : undefined,

    addressLine1: trimOrUndef(data.addressLine1),
    addressLine2: trimOrUndef(data.addressLine2),
    addressLine3: trimOrUndef(data.addressLine3),
    townOrCity: trimOrUndef(data.townOrCity),
    postcode: trimOrUndef(data.postcode),

    pronouns: optionalValue(data.pronouns),
    pronounsOtherText: data.pronouns === "OTHER" ? trimOrUndef(data.pronounsOtherText) : undefined,

    childrenCount: sel.showChildrenQs && data.hasChildren ? optionalValue(data.childrenCount) : undefined,
    hasDisabilityOrSensory: sel.showDisabilityQs ? data.hasDisabilityOrSensory : undefined,
    disabilityType:
      sel.showDisabilityQs && data.hasDisabilityOrSensory
        ? optionalValue(data.disabilityType)
        : undefined,
    householdSize: sel.showHouseholdSize ? optionalValue(data.householdSize) : undefined,
    domesticAbuse: sel.showDomesticAbuseQs ? data.domesticAbuse : undefined,
    safeToContact,
    safeContactNotes:
      sel.showDomesticAbuseQs && data.domesticAbuse && safeToContact === "no"
        ? trimOrUndef(data.safeContactNotes)
        : undefined,
    ageRange,

    urgent: optionalValue(data.urgent),
    urgentReason: optionalValue(data.urgentReason),
    urgentReasonOtherText:
      data.urgentReason === "OTHER" ? trimOrUndef(data.urgentReasonOtherText) : undefined,

    additionalInfo: trimOrUndef(data.additionalInfo),

    supportNeeds: getSupportNeedsArray(data),
    supportNotes: trimOrUndef(data.supportNotes),
    otherSupport: trimOrUndef(data.otherSupport),

    contactMethod,
  };

  return payload;
}

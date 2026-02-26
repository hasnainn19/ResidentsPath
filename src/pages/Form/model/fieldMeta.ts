/**
 * Field metadata for labels + review-page display rules.
 * Defines labels, dependencies, and display formatting.
 */

import dayjs from "dayjs";
import { getEnquirySelectionState } from "./getEnquirySelectionState";
import type { FormData } from "./formFieldTypes";
import {
  DepartmentLabelById,
  FIELD_TEXT_CONSTRAINTS,
  UI_OPTIONS,
} from "../../../../shared/formSchema";

export type EnquiryContext = ReturnType<typeof getEnquirySelectionState>;
export type FieldKey = keyof FormData;

export type FieldMeta = {
  label: string;

  // If set, the review page uses this instead of label
  reviewLabel?: string;

  // Hide on review unless the resident chose to provide personal details
  requiresDetails?: boolean;

  // Hide on review unless this is true (eg dependent fields)
  dependsOn?: (fd: FormData) => boolean;

  // Hide on review unless the enquiry context says the question was actually shown
  askedInContext?: (ctx: EnquiryContext) => boolean;

  // For boolean fields where false should mean omit the row entirely
  showOnlyWhenTrue?: boolean;

  // Hide on review when this is true
  omitWhen?: (fd: FormData) => boolean;

  // Converts stored value into a review-friendly value
  format?: (fd: FormData, ctx: EnquiryContext) => unknown;

  // Max text length allowed for input (for text fields)
  maxLen?: number;

  // Whether to allow new lines in the input (for text fields)
  allowNewlines?: boolean;
};

const URGENCY_LABELS: Record<FormData["urgent"], string> = {
  yes: "Yes",
  no: "No",
  unsure: "Unsure",
};

const SAFE_TO_CONTACT_LABELS: Record<FormData["safeToContact"], string> = {
  yes: "Yes",
  no: "No",
  prefer_not_to_say: "Prefer not to say",
};

type OptionList = ReadonlyArray<{ value: string; label: string }>;

function optionLabel(opts: OptionList, value: unknown) {
  if (typeof value !== "string") return value;
  if (value.trim() === "") return value;
  const found = opts.find((o) => o.value === value);
  return found ? found.label : value;
}

export const FIELD_META: Record<FieldKey, FieldMeta> = {
  language: { label: "Language" },

  provideDetails: { label: "Provide personal details?" },

  firstName: {
    label: "First name",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.firstName.maxLen,
  },
  middleName: {
    label: "Middle name",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.middleName.maxLen,
  },
  lastName: {
    label: "Last name",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.lastName.maxLen,
  },
  preferredName: {
    label: "Preferred name",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.preferredName.maxLen,
  },

  email: { label: "Email", requiresDetails: true, maxLen: FIELD_TEXT_CONSTRAINTS.email.maxLen },
  phoneCountry: { label: "Phone country", requiresDetails: true },
  phone: { label: "Phone number", requiresDetails: true },

  dob: {
    label: "Date of birth",
    requiresDetails: true,
    format: (fd) => {
      if (!fd.dob) return null;
      const d = dayjs(fd.dob);
      return d.isValid() ? d.format("D MMMM YYYY") : fd.dob;
    },
  },

  addressLine1: {
    label: "Address line 1",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.addressLine1.maxLen,
  },
  addressLine2: {
    label: "Address line 2",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.addressLine2.maxLen,
  },
  addressLine3: {
    label: "Address line 3",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.addressLine3.maxLen,
  },
  townOrCity: {
    label: "Town or city",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.townOrCity.maxLen,
  },
  postcode: {
    label: "Postcode",
    requiresDetails: true,
    maxLen: FIELD_TEXT_CONSTRAINTS.postcode.maxLen,
  },

  pronouns: {
    label: "Pronouns",
    requiresDetails: true,
    format: (fd) => {
      const p = fd.pronouns;
      if (p === "OTHER") {
        const details = (fd.pronounsOtherText ?? "").trim();
        return details ? `${details}` : "Other";
      }
      return optionLabel(UI_OPTIONS.pronouns, p);
    },
  },

  // Stored separately but displayed as part of Pronouns on review
  pronounsOtherText: {
    label: "Pronouns (other)",
    requiresDetails: true,
    omitWhen: () => true,
  },

  topLevel: { label: "Top level service area" },
  generalServicesChoice: { label: "General services choice" },

  enquiryId: {
    label: "Choose an enquiry",
    dependsOn: (fd) => fd.topLevel !== "Other",
    format: (_fd, ctx) => ctx.selectedEnquiry?.label || "",
  },

  specificDetailId: {
    label: "More detail",
    dependsOn: (fd) => fd.topLevel !== "Other",
    format: (fd, ctx) => {
      return (
        ctx.selectedEnquiry?.specifics?.find((d) => d.value === fd.specificDetailId)?.label || ""
      );
    },
  },

  routedDepartment: {
    label: "Routed department",
    format: (fd) =>
      fd.routedDepartment
        ? (DepartmentLabelById[fd.routedDepartment] ?? fd.routedDepartment)
        : null,
  },

  otherEnquiryText: {
    label: "Describe your enquiry",
    dependsOn: (fd) => fd.topLevel === "Other",
    maxLen: FIELD_TEXT_CONSTRAINTS.otherEnquiryText.maxLen,
    allowNewlines: FIELD_TEXT_CONSTRAINTS.otherEnquiryText.allowNewlines,
  },

  hasChildren: {
    label: "I have dependent children",
    askedInContext: (ctx) => ctx.showChildrenQs,
  },
  childrenCount: {
    label: "How many children?",
    askedInContext: (ctx) => ctx.showChildrenQs,
    dependsOn: (fd) => fd.hasChildren,
  },

  hasDisabilityOrSensory: {
    label: "I have a disability or sensory impairment",
    askedInContext: (ctx) => ctx.showDisabilityQs,
  },
  disabilityType: {
    label: "Select a type...",
    askedInContext: (ctx) => ctx.showDisabilityQs,
    dependsOn: (fd) => fd.hasDisabilityOrSensory,
    format: (fd) => optionLabel(UI_OPTIONS.disabilityType, fd.disabilityType),
  },

  householdSize: {
    label: "How many people are in your household?",
    askedInContext: (ctx) => ctx.showHouseholdSize,
    format: (fd) => optionLabel(UI_OPTIONS.householdSize, fd.householdSize),
  },

  domesticAbuse: {
    label: "I am a domestic abuse victim/survivor",
    askedInContext: (ctx) => ctx.showDomesticAbuseQs,
  },
  safeToContact: {
    label: "Is it safe for us to contact you?",
    askedInContext: (ctx) => ctx.showDomesticAbuseQs,
    dependsOn: (fd) => fd.domesticAbuse,
    format: (fd) => SAFE_TO_CONTACT_LABELS[fd.safeToContact] || fd.safeToContact,
  },
  safeContactNotes: {
    label: "Safe contact notes",
    askedInContext: (ctx) => ctx.showDomesticAbuseQs,
    dependsOn: (fd) => fd.domesticAbuse && fd.safeToContact === "no",
    maxLen: FIELD_TEXT_CONSTRAINTS.safeContactNotes.maxLen,
    allowNewlines: FIELD_TEXT_CONSTRAINTS.safeContactNotes.allowNewlines,
  },

  ageRange: {
    label: "Age range",
    dependsOn: (fd) => !fd.dob,
    askedInContext: (ctx) => ctx.showAgeRange,
    format: (fd) => optionLabel(UI_OPTIONS.ageRange, fd.ageRange),
  },

  urgent: {
    label: "Do you need support sooner today?",
    format: (fd) => URGENCY_LABELS[fd.urgent] || fd.urgent,
  },
  urgentReason: {
    label: "What best describes why?",
    dependsOn: (fd) => fd.urgent === "yes",
    format: (fd) => {
      const r = fd.urgentReason;
      if (r === "OTHER") {
        const details = (fd.urgentReasonOtherText ?? "").trim();
        return details ? `${details}` : "Other";
      }
      return optionLabel(UI_OPTIONS.urgentReason, r);
    },
  },

  // Stored separately but displayed as part of urgent reason on review.
  urgentReasonOtherText: {
    label: "Urgent reason (other)",
    omitWhen: () => true,
  },

  additionalInfo: {
    label: "Anything else you want to tell us",
    maxLen: FIELD_TEXT_CONSTRAINTS.additionalInfo.maxLen,
    allowNewlines: FIELD_TEXT_CONSTRAINTS.additionalInfo.allowNewlines,
  },

  proceed: {
    label: "How would you like to proceed?",
    format: (fd) => optionLabel(UI_OPTIONS.proceed, fd.proceed),
  },

  needsAccessibility: {
    label: "Accessibility support (for example: step-free access, hearing loop)",
  },
  needsLanguage: { label: "Language support" },
  needsSeating: { label: "Seating (cannot stand for long)" },
  needsWrittenUpdates: { label: "Written updates (for example: cannot hear announcements)" },
  needsLargeText: { label: "Large text / help reading" },
  needsQuietSpace: { label: "Quieter space" },
  needsBSL: { label: "Interpreter (BSL)" },
  needsHelpWithForms: { label: "Help completing forms" },
  supportNotes: {
    label: "Support notes",
    maxLen: FIELD_TEXT_CONSTRAINTS.supportNotes.maxLen,
    allowNewlines: FIELD_TEXT_CONSTRAINTS.supportNotes.allowNewlines,
  },
  otherSupport: { label: "Other support", maxLen: FIELD_TEXT_CONSTRAINTS.otherSupport.maxLen },

  contactMethod: {
    label: "Preferred method of contact",
    requiresDetails: true,
    format: (fd) => optionLabel(UI_OPTIONS.contactMethod, fd.contactMethod),
  },

  appointmentDateIso: {
    label: "Appointment date",
    dependsOn: (fd) => fd.proceed === "BOOK_APPOINTMENT",
    format: (fd) => {
      if (!fd.appointmentDateIso) return null;
      const d = dayjs(fd.appointmentDateIso);
      return d.isValid() ? d.format("D MMMM YYYY") : fd.appointmentDateIso;
    },
  },
  appointmentTime: {
    label: "Appointment time",
    dependsOn: (fd) => fd.proceed === "BOOK_APPOINTMENT",
  },
};

export function getReviewLabel(key: FieldKey): string {
  const meta = FIELD_META[key];
  return meta.reviewLabel ?? meta.label;
}

function isEmptyForReview(key: FieldKey, val: unknown): boolean {
  const meta = FIELD_META[key];

  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;

  if (typeof val === "boolean" && meta.showOnlyWhenTrue && val === false) return true;

  return false;
}

export function getReviewDisplayValue(
  key: FieldKey,
  fd: FormData,
  ctx: EnquiryContext,
): string | null {
  const meta = FIELD_META[key];

  if (meta.requiresDetails && fd.provideDetails !== "yes") return null;
  if (meta.askedInContext && !meta.askedInContext(ctx)) return null;
  if (meta.dependsOn && !meta.dependsOn(fd)) return null;
  if (meta.omitWhen && meta.omitWhen(fd)) return null;

  const raw: unknown = meta.format ? meta.format(fd, ctx) : fd[key];
  if (isEmptyForReview(key, raw)) return null;

  return typeof raw === "boolean" ? (raw ? "Yes" : "No") : String(raw);
}

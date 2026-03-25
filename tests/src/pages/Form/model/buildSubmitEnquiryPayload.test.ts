import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ENQUIRIES_BY_TOPLEVEL } from "../../../../../src/pages/Form/data/enquiries";
import { buildSubmitEnquiryPayload } from "../../../../../src/pages/Form/model/buildSubmitEnquiryPayload";
import type { FormData } from "../../../../../src/pages/Form/model/formFieldTypes";
import { initialFormData } from "../../../../../src/pages/Form/model/initialState";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

describe("buildSubmitEnquiryPayload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds an appointment payload from the active enquiry context", () => {
    const payload = buildSubmitEnquiryPayload(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
        firstName: " Test ",
        middleName: " Middle ",
        lastName: " Tester ",
        preferredName: " T ",
        dob: "2000-06-01",
        phoneCountry: "GB",
        phone: "020 7946 0018",
        pronouns: "OTHER",
        pronounsOtherText: " Ze/zir ",
        hasChildren: true,
        childrenCount: "2",
        hasDisabilityOrSensory: true,
        disabilityType: "HEARING_IMPAIRMENT",
        householdSize: "4",
        domesticAbuse: true,
        safeToContact: "no",
        safeContactNotes: " Email only ",
        urgent: "yes",
        urgentReason: "OTHER",
        urgentReasonOtherText: " Need help today ",
        additionalInfo: " More detail ",
        proceed: "BOOK_APPOINTMENT",
        appointmentDateIso: " 2026-06-20 ",
        appointmentTime: " 10:00 ",
        needsAccessibility: true,
        needsLargeText: true,
        supportNotes: " Support note ",
        otherSupport: " Something else ",
        contactMethod: "TEXT_MESSAGE",
      }),
    );

    expect(payload).toMatchObject({
      departmentName: "Homelessness",
      enquiry: "homelessness",
      proceed: "BOOK_APPOINTMENT",
      firstName: "Test",
      middleName: "Middle",
      lastName: "Tester",
      preferredName: "T",
      dob: "2000-06-01",
      phoneCountry: "GB",
      phone: "+442079460018",
      pronouns: "OTHER",
      pronounsOtherText: "Ze/zir",
      childrenCount: "2",
      hasDisabilityOrSensory: true,
      disabilityType: "HEARING_IMPAIRMENT",
      householdSize: "4",
      domesticAbuse: true,
      safeToContact: "no",
      safeContactNotes: "Email only",
      ageRange: "AGE_25_34",
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Need help today",
      additionalInfo: "More detail",
      appointmentDateIso: "2026-06-20",
      appointmentTime: "10:00",
      supportNotes: "Support note",
      otherSupport: "Something else",
      contactMethod: "TEXT_MESSAGE",
    });
    expect(payload.supportNeeds).toEqual(["ACCESSIBILITY", "LARGE_TEXT"]);
  });

  it("omits irrelevant values from the payload", () => {
    const payload = buildSubmitEnquiryPayload(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
        pronouns: "HE_HIM",
        pronounsOtherText: "Should disappear",
        hasChildren: false,
        childrenCount: "2",
        hasDisabilityOrSensory: false,
        disabilityType: "HEARING_IMPAIRMENT",
        domesticAbuse: false,
        safeToContact: "no",
        safeContactNotes: "Should disappear",
        urgent: "yes",
        urgentReason: "SAFETY_CONCERN",
        urgentReasonOtherText: "Should disappear",
        proceed: "JOIN_DIGITAL_QUEUE",
        appointmentDateIso: "2026-06-20",
        appointmentTime: "10:00",
      }),
    );

    expect(payload).toMatchObject({
      appointmentDateIso: undefined,
      appointmentTime: undefined,
      childrenCount: undefined,
      disabilityType: undefined,
      safeToContact: undefined,
      safeContactNotes: undefined,
      pronounsOtherText: undefined,
      urgentReasonOtherText: undefined,
    });
  });

  it("omits follow-up fields that are not asked by the selected enquiry", () => {
    const originalEnquiry = ENQUIRIES_BY_TOPLEVEL.CouncilTax[0];

    ENQUIRIES_BY_TOPLEVEL.CouncilTax[0] = {
      ...originalEnquiry,
      askVulnerabilityQs: false,
      askHouseholdSize: false,
      askDomesticAbuseQs: false,
      askAgeQs: false,
    };

    try {
      const payload = buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "CouncilTax",
          enquiryId: "council_tax",
          dob: "2000-06-01",
          hasDisabilityOrSensory: true,
          disabilityType: "HEARING_IMPAIRMENT",
          householdSize: "4",
          domesticAbuse: true,
          safeToContact: "no",
          safeContactNotes: "Should disappear",
          proceed: "JOIN_DIGITAL_QUEUE",
        }),
      );

      expect(payload).toMatchObject({
        ageRange: undefined,
        hasDisabilityOrSensory: undefined,
        disabilityType: undefined,
        householdSize: undefined,
        domesticAbuse: undefined,
        safeToContact: undefined,
        safeContactNotes: undefined,
      });
    } finally {
      ENQUIRIES_BY_TOPLEVEL.CouncilTax[0] = originalEnquiry;
    }
  });

  it("throws when it cannot resolve a department", () => {
    expect(() =>
      buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "",
          enquiryId: "",
          routedDepartment: "",
          proceed: "JOIN_DIGITAL_QUEUE",
        }),
      ),
    ).toThrow("Unknown department");
  });

  it("throws when proceed is missing after the department has been resolved", () => {
    expect(() =>
      buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "homelessness",
          proceed: "",
        }),
      ),
    ).toThrow("proceed is required");
  });

  it("derives age ranges from the date of birth", () => {
    const cases: Array<[string, FormData["ageRange"]]> = [
      ["2010-06-15", "UNDER_18"],
      ["2002-12-31", "AGE_18_24"],
      ["1985-12-31", "AGE_35_44"],
      ["1975-06-15", "AGE_45_54"],
      ["1965-06-14", "AGE_55_64"],
      ["1940-06-14", "AGE_65_PLUS"],
    ];

    for (const [dob, expectedAgeRange] of cases) {
      const payload = buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "homelessness",
          dob,
          proceed: "JOIN_DIGITAL_QUEUE",
        }),
      );

      expect(payload.ageRange).toBe(expectedAgeRange);
    }
  });

  it("omits age ranges for invalid or future dates of birth", () => {
    expect(
      buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "homelessness",
          dob: "not-a-date",
          proceed: "JOIN_DIGITAL_QUEUE",
        }),
      ).ageRange,
    ).toBeUndefined();

    expect(
      buildSubmitEnquiryPayload(
        makeFormData({
          topLevel: "Housing",
          enquiryId: "homelessness",
          dob: "2099-06-15",
          proceed: "JOIN_DIGITAL_QUEUE",
        }),
      ).ageRange,
    ).toBeUndefined();
  });
  
  it("maps the remaining support needs", () => {
    const payload = buildSubmitEnquiryPayload(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
        proceed: "JOIN_DIGITAL_QUEUE",
        needsLanguage: true,
        needsSeating: true,
        needsWrittenUpdates: true,
        needsQuietSpace: true,
        needsBSL: true,
        needsHelpWithForms: true,
      }),
    );

    expect(payload.supportNeeds).toEqual([
      "LANGUAGE",
      "SEATING",
      "WRITTEN_UPDATES",
      "QUIET_SPACE",
      "BSL",
      "HELP_WITH_FORMS",
    ]);
  });
});

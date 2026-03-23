import { describe, expect, it } from "vitest";

import {
  FIELD_META,
  getReviewDisplayValue,
  getReviewLabel,
} from "../../../pages/Form/model/fieldMeta";
import { ENQUIRIES_BY_TOPLEVEL } from "../../../pages/Form/data/enquiries";
import type { FormData } from "../../../pages/Form/model/formFieldTypes";
import { getEnquirySelectionState } from "../../../pages/Form/model/getEnquirySelectionState";
import { initialFormData } from "../../../pages/Form/model/initialState";

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...initialFormData,
    ...overrides,
  };
}

describe("fieldMeta", () => {
  it("returns the field label when no custom review label is defined", () => {
    expect(getReviewLabel("firstName")).toBe("First name");
  });

  it("omits personal detail fields on review when details were not provided", () => {
    const formData = makeFormData({
      provideDetails: "no",
      firstName: "Test",
    });

    expect(
      getReviewDisplayValue("firstName", formData, getEnquirySelectionState(formData)),
    ).toBeNull();
  });

  it("omits fields hidden by omitWhen rules", () => {
    const formData = makeFormData({
      privacyNoticeAccepted: true,
    });

    expect(
      getReviewDisplayValue(
        "privacyNoticeAccepted",
        formData,
        getEnquirySelectionState(formData),
      ),
    ).toBeNull();
  });

  it("formats OTHER pronouns using the custom text", () => {
    const formData = makeFormData({
      pronouns: "OTHER",
      pronounsOtherText: "Ze/zir",
    });

    expect(
      getReviewDisplayValue("pronouns", formData, getEnquirySelectionState(formData)),
    ).toBe("Ze/zir");
  });

  it("formats standard pronouns using the option label", () => {
    const formData = makeFormData({
      pronouns: "HE_HIM",
    });

    expect(
      getReviewDisplayValue("pronouns", formData, getEnquirySelectionState(formData)),
    ).toBe("He/him");
  });

  it("formats OTHER urgent reasons using the custom text", () => {
    const formData = makeFormData({
      urgent: "yes",
      urgentReason: "OTHER",
      urgentReasonOtherText: "Need help today",
    });

    expect(
      getReviewDisplayValue("urgentReason", formData, getEnquirySelectionState(formData)),
    ).toBe("Need help today");
  });

  it("formats standard option-backed review values", () => {
    const formData = makeFormData({
      topLevel: "Housing",
      enquiryId: "homelessness",
      routedDepartment: "Adults_Duty",
      hasDisabilityOrSensory: true,
      disabilityType: "HEARING_IMPAIRMENT",
      householdSize: "4",
      domesticAbuse: true,
      safeToContact: "PREFER_NOT_TO_SAY",
      urgent: "unsure",
      proceed: "BOOK_APPOINTMENT",
      appointmentTime: "10:00",
      contactMethod: "EMAIL",
    });
    const ctx = getEnquirySelectionState(formData);

    expect(getReviewDisplayValue("enquiryId", formData, ctx)).toBe("Homelessness");
    expect(getReviewDisplayValue("routedDepartment", formData, ctx)).toBe("Adults duty");
    expect(getReviewDisplayValue("hasDisabilityOrSensory", formData, ctx)).toBe("Yes");
    expect(getReviewDisplayValue("disabilityType", formData, ctx)).toBe("Hearing impairment");
    expect(getReviewDisplayValue("householdSize", formData, ctx)).toBe("4");
    expect(getReviewDisplayValue("domesticAbuse", formData, ctx)).toBe("Yes");
    expect(getReviewDisplayValue("safeToContact", formData, ctx)).toBe("Prefer not to say");
    expect(getReviewDisplayValue("urgent", formData, ctx)).toBe("Unsure");
    expect(getReviewDisplayValue("proceed", formData, ctx)).toBe("Book appointment");
    expect(getReviewDisplayValue("contactMethod", formData, ctx)).toBe("Email");
    expect(getReviewDisplayValue("appointmentTime", formData, ctx)).toBe("10:00");
  });

  it("formats standard urgent reasons when urgency is yes", () => {
    const formData = makeFormData({
      urgent: "yes",
      urgentReason: "SAFETY_CONCERN",
    });

    expect(
      getReviewDisplayValue("urgentReason", formData, getEnquirySelectionState(formData)),
    ).toBe("Safety concern");
  });

  it("formats routed departments with their display labels", () => {
    const formData = makeFormData({
      routedDepartment: "Adults_Duty",
    });

    expect(
      getReviewDisplayValue("routedDepartment", formData, getEnquirySelectionState(formData)),
    ).toBe("Adults duty");
  });

  it("returns null for empty formatted review values", () => {
    const formData = makeFormData({
      enquiryId: "missing",
      specificDetailId: "missing",
      routedDepartment: "",
      contactMethod: "",
    });
    const ctx = getEnquirySelectionState(formData);

    expect(getReviewDisplayValue("enquiryId", formData, ctx)).toBeNull();
    expect(getReviewDisplayValue("specificDetailId", formData, ctx)).toBeNull();
    expect(getReviewDisplayValue("routedDepartment", formData, ctx)).toBeNull();
    expect(getReviewDisplayValue("contactMethod", formData, ctx)).toBeNull();
  });

  it("formats valid appointment dates for review", () => {
    const appointmentFormData = makeFormData({
      proceed: "BOOK_APPOINTMENT",
      appointmentDateIso: "2026-06-20",
    });

    expect(
      getReviewDisplayValue(
        "appointmentDateIso",
        appointmentFormData,
        getEnquirySelectionState(appointmentFormData),
      ),
    ).toBe("20 June 2026");
  });

  it("formats valid dates of birth for review", () => {
    const validFormData = makeFormData({
      dob: "2000-06-01",
    });

    expect(
      getReviewDisplayValue("dob", validFormData, getEnquirySelectionState(validFormData)),
    ).toBe("1 June 2000");
  });

  it("hides appointment review rows when the resident did not choose booking", () => {
    const appointmentFormData = makeFormData({
      proceed: "JOIN_DIGITAL_QUEUE",
      appointmentDateIso: "2026-06-20",
      appointmentTime: "10:00",
    });

    expect(
      getReviewDisplayValue(
        "appointmentDateIso",
        appointmentFormData,
        getEnquirySelectionState(appointmentFormData),
      ),
    ).toBeNull();
    expect(
      getReviewDisplayValue(
        "appointmentTime",
        appointmentFormData,
        getEnquirySelectionState(appointmentFormData),
      ),
    ).toBeNull();
  });

  it("hides the age range review row when a date of birth is present", () => {
    const ageRangeFormData = makeFormData({
      topLevel: "Housing",
      enquiryId: "homelessness",
      dob: "2000-06-01",
      ageRange: "AGE_25_34",
    });

    expect(
      getReviewDisplayValue(
        "ageRange",
        ageRangeFormData,
        getEnquirySelectionState(ageRangeFormData),
      ),
    ).toBeNull();
  });

  it("omits fields that were not shown in the enquiry context", () => {
    const formData = makeFormData({
      childrenCount: "2",
    });

    expect(
      getReviewDisplayValue("childrenCount", formData, getEnquirySelectionState(formData)),
    ).toBeNull();
  });

  it("shows child review values when the enquiry context asked for them", () => {
    const formData = makeFormData({
      topLevel: "ChildrensDuty",
      enquiryId: "child_safety_concerns",
      hasChildren: true,
      childrenCount: "2",
    });
    const ctx = getEnquirySelectionState(formData);

    expect(getReviewDisplayValue("hasChildren", formData, ctx)).toBe("Yes");
    expect(getReviewDisplayValue("childrenCount", formData, ctx)).toBe("2");
  });

  it("shows the age-range review value when the enquiry context asked for it", () => {
    const formData = makeFormData({
      topLevel: "ChildrensDuty",
      enquiryId: "child_safety_concerns",
      ageRange: "AGE_25_34",
    });
    const ctx = getEnquirySelectionState(formData);

    expect(getReviewDisplayValue("ageRange", formData, ctx)).toBe("25-34");
  });

  it("omits dependent fields when their prerequisites are not met", () => {
    const formData = makeFormData({
      topLevel: "Housing",
      enquiryId: "homelessness",
      domesticAbuse: true,
      safeToContact: "yes",
      safeContactNotes: "Should be hidden",
    });

    expect(
      getReviewDisplayValue("safeContactNotes", formData, getEnquirySelectionState(formData)),
    ).toBeNull();
  });

  it("shows safe contact notes when the domestic abuse path requires them", () => {
    const formData = makeFormData({
      topLevel: "Housing",
      enquiryId: "homelessness",
      domesticAbuse: true,
      safeToContact: "no",
      safeContactNotes: "Use email only",
    });

    expect(
      getReviewDisplayValue("safeContactNotes", formData, getEnquirySelectionState(formData)),
    ).toBe("Use email only");
  });

  it("evaluates contextual review metadata for follow-up questions", () => {
    const hiddenCtx = getEnquirySelectionState(makeFormData());
    const shownCtx = getEnquirySelectionState(
      makeFormData({
        topLevel: "Housing",
        enquiryId: "homelessness",
      }),
    );

    expect(FIELD_META.hasChildren.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.hasChildren.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.childrenCount.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.childrenCount.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.hasDisabilityOrSensory.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.hasDisabilityOrSensory.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.disabilityType.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.disabilityType.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.householdSize.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.householdSize.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.domesticAbuse.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.domesticAbuse.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.safeToContact.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.safeToContact.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.safeContactNotes.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.safeContactNotes.askedInContext?.(shownCtx)).toBe(true);
    expect(FIELD_META.ageRange.askedInContext?.(hiddenCtx)).toBe(false);
    expect(FIELD_META.ageRange.askedInContext?.(shownCtx)).toBe(true);
  });

  it("evaluates conditional review dependencies", () => {
    expect(FIELD_META.childrenCount.dependsOn?.(makeFormData({ hasChildren: false }))).toBe(false);
    expect(FIELD_META.childrenCount.dependsOn?.(makeFormData({ hasChildren: true }))).toBe(true);
    expect(
      FIELD_META.disabilityType.dependsOn?.(makeFormData({ hasDisabilityOrSensory: false })),
    ).toBe(false);
    expect(
      FIELD_META.disabilityType.dependsOn?.(makeFormData({ hasDisabilityOrSensory: true })),
    ).toBe(true);
    expect(FIELD_META.safeToContact.dependsOn?.(makeFormData({ domesticAbuse: false }))).toBe(
      false,
    );
    expect(FIELD_META.safeToContact.dependsOn?.(makeFormData({ domesticAbuse: true }))).toBe(true);
    expect(
      FIELD_META.safeContactNotes.dependsOn?.(
        makeFormData({ domesticAbuse: true, safeToContact: "yes" }),
      ),
    ).toBe(false);
    expect(
      FIELD_META.safeContactNotes.dependsOn?.(
        makeFormData({ domesticAbuse: true, safeToContact: "no" }),
      ),
    ).toBe(true);
    expect(FIELD_META.urgentReason.dependsOn?.(makeFormData({ urgent: "no" }))).toBe(false);
    expect(FIELD_META.urgentReason.dependsOn?.(makeFormData({ urgent: "yes" }))).toBe(true);
    expect(FIELD_META.appointmentDateIso.dependsOn?.(makeFormData({ proceed: "" }))).toBe(false);
    expect(
      FIELD_META.appointmentDateIso.dependsOn?.(
        makeFormData({ proceed: "BOOK_APPOINTMENT" }),
      ),
    ).toBe(true);
    expect(FIELD_META.appointmentTime.dependsOn?.(makeFormData({ proceed: "" }))).toBe(false);
    expect(
      FIELD_META.appointmentTime.dependsOn?.(
        makeFormData({ proceed: "BOOK_APPOINTMENT" }),
      ),
    ).toBe(true);
    expect(FIELD_META.ageRange.dependsOn?.(makeFormData({ dob: "2000-06-01" }))).toBe(false);
    expect(FIELD_META.ageRange.dependsOn?.(makeFormData({ dob: "" }))).toBe(true);
  });

  it("omits hidden helper fields that are folded into other review values", () => {
    const formData = makeFormData({
      pronounsOtherText: "Ze/zir",
      urgentReasonOtherText: "Need help today",
    });
    const ctx = getEnquirySelectionState(formData);

    expect(getReviewDisplayValue("pronounsOtherText", formData, ctx)).toBeNull();
    expect(getReviewDisplayValue("urgentReasonOtherText", formData, ctx)).toBeNull();
  });

  it("formats specific detail labels when the selected enquiry provides them", () => {
    const originalSpecifics = ENQUIRIES_BY_TOPLEVEL.Housing[0]?.specifics;

    ENQUIRIES_BY_TOPLEVEL.Housing[0].specifics = [
      { value: "benefit_change", label: "Benefit change" },
    ];

    try {
      const formData = makeFormData({
        topLevel: "Housing",
        enquiryId: "housing_benefit",
        specificDetailId: "benefit_change",
      });

      expect(
        getReviewDisplayValue("specificDetailId", formData, getEnquirySelectionState(formData)),
      ).toBe("Benefit change");
    } finally {
      ENQUIRIES_BY_TOPLEVEL.Housing[0].specifics = originalSpecifics;
    }
  });

  it("renders boolean review values as Yes or No when they are not hidden", () => {
    const trueFormData = makeFormData({
      needsLanguage: true,
    });
    const falseFormData = makeFormData({
      needsLanguage: false,
    });

    expect(
      getReviewDisplayValue("needsLanguage", trueFormData, getEnquirySelectionState(trueFormData)),
    ).toBe("Yes");
    expect(
      getReviewDisplayValue(
        "needsLanguage",
        falseFormData,
        getEnquirySelectionState(falseFormData),
      ),
    ).toBe("No");
  });

  it("omits false boolean review values when showOnlyWhenTrue is enabled", () => {
    FIELD_META.needsLanguage.showOnlyWhenTrue = true;

    try {
      expect(
        getReviewDisplayValue(
          "needsLanguage",
          makeFormData({
            needsLanguage: false,
          }),
          getEnquirySelectionState(makeFormData()),
        ),
      ).toBeNull();
    } finally {
      delete FIELD_META.needsLanguage.showOnlyWhenTrue;
    }
  });
});

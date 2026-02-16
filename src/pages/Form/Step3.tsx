// src/pages/Form/Step3.tsx
/**
 * Step 3: review and submit.
 *
 * Shows a summary of what has been entered so far, with links back to edit earlier steps.
 * Only relevant answers are shown (eg conditional questions that were actually asked, and values
 * that apply based on earlier choices).
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack, Divider, Box } from "@mui/material";
import StepShell from "./components/StepShell";
import WithTTS from "./components/WithTTS";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";
import type { FormData } from "./model/types";
import StepActions from "./components/StepActions";
import { getEnquiryContext } from "./model/enquiriesContext";

type EnquiryContext = ReturnType<typeof getEnquiryContext>;

export default function Step3() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  // TODO(BACKEND)
  const submitToBackend = () => {
    const payload = {
      ...formData,
      ageRange: formData.dob ? "" : formData.ageRange,
      childrenCount: formData.hasChildren ? formData.childrenCount : "0",
      disabilityType: formData.hasDisabilityOrSensory ? formData.disabilityType : "",
      urgentOtherReason: formData.urgentReason === "Other" ? formData.urgentOtherReason : "",
    };
    console.log(payload);
    alert("Submitted (mock)");
  };

  // Labels which should appear on the review page. Note that not all fields will necessarily be shown
  const reviewLabels: Partial<Record<keyof FormData, string>> = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone number",
    dob: "Date of birth",
    contactMethod: "Preferred method of contact",
    addressLine1: "Address line 1",
    addressLine2: "Address line 2",
    addressLine3: "Address line 3",
    townOrCity: "Town or city",
    postcode: "Postcode",

    enquiryId: "Choose an enquiry",
    specificDetailId: "More detail",
    otherEnquiryText: "Describe your enquiry",

    hasChildren: "I have dependent children",
    childrenCount: "How many children?",
    householdSize: "How many people are in your household?",
    hasDisabilityOrSensory: "I have a disability or sensory impairment",
    disabilityType: "Select a type...",
    ageRange: "Age range",
    domesticAbuse: "I am a domestic abuse victim/survivor",
    safeToContact: "Is it safe for us to contact you?",
    safeContactNotes: "Safe contact notes",

    urgent: "Do you need support sooner today?",
    urgentReason: "What best describes why?",
    urgentOtherReason: "Please tell us why",

    needsAccessibility: "Accessibility support (for example: step-free access, hearing loop)",
    needsLanguage: "Language support / interpretation",
    needsSeating: "Seating (cannot stand for long)",
    needsWrittenUpdates: "Written updates (for example: cannot hear announcements)",
    needsLargeText: "Large text / help reading",
    needsQuietSpace: "Quieter space",
    needsBSL: "Interpreter (BSL)",
    needsHelpWithForms: "Help completing forms",
    otherSupport: "Other support",

    additionalInfo: "Anything else you want to tell us",
    proceed: "How would you like to proceed?",
  };

  const URGENCY_LABELS: Record<string, string> = {
    yes: "Yes",
    no: "No",
    unsure: "Unsure",
  };

  const SAFE_TO_CONTACT_LABELS: Record<string, string> = {
    yes: "Yes",
    no: "No",
    prefer_not_to_say: "Prefer not to say",
  };

  // Sections to group the review information into, with links to edit the relevant earlier step.
  const SECTIONS: Array<{
    title: string;
    keys: Array<keyof FormData>;
    editTo: "/form/step-1" | "/form/step-2";
  }> = [
    {
      title: "Your details",
      keys: [
        "firstName",
        "lastName",
        "dob",
        "email",
        "phone",
        "contactMethod",
        "addressLine1",
        "addressLine2",
        "addressLine3",
        "townOrCity",
        "postcode",
      ],
      editTo: "/form/step-1",
    },
    {
      title: "Your request",
      keys: ["enquiryId", "specificDetailId", "otherEnquiryText", "proceed", "additionalInfo"],
      editTo: "/form/step-2",
    },
    {
      title: "Urgency",
      keys: ["urgent", "urgentReason", "urgentOtherReason"],
      editTo: "/form/step-2",
    },
    {
      title: "Additional questions",
      keys: [
        "hasChildren",
        "childrenCount",
        "householdSize",
        "hasDisabilityOrSensory",
        "disabilityType",
        "ageRange",
        "domesticAbuse",
        "safeToContact",
        "safeContactNotes",
      ],
      editTo: "/form/step-2",
    },
    {
      title: "Support needs",
      keys: [
        "needsAccessibility",
        "needsLanguage",
        "needsSeating",
        "needsWrittenUpdates",
        "needsLargeText",
        "needsQuietSpace",
        "needsBSL",
        "needsHelpWithForms",
        "otherSupport",
      ],
      editTo: "/form/step-2",
    },
  ];

  // Two-column layout for review: label left, answer right
  function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 1fr) minmax(260px, 1fr)",
          py: 1.25,
          px: 2,
          "&:hover": { bgcolor: "grey.50" },
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "left", pr: 2, minWidth: 220, fontWeight: 800 }}
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: "right",
            wordBreak: "break-word",
            flex: 1,
            fontWeight: 800,
            pl: 2,
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }

  function isNotNull<T>(x: T | null | undefined | false): x is T {
    return x !== null && x !== undefined && x !== false;
  }

  // For some fields, we only want to show them on the review page if they're true
  // because false is implicit in them not being shown at all
  const SHOW_ONLY_WHEN_TRUE: ReadonlySet<keyof FormData> = new Set([
    "needsAccessibility",
    "needsLanguage",
    "needsSeating",
    "needsWrittenUpdates",
    "needsLargeText",
    "needsQuietSpace",
    "needsBSL",
    "needsHelpWithForms",
  ]);

  // Treat empty strings/nulls as "not answered" and omit them from the review.
  function isEmptyForReview(key: keyof FormData, val: unknown) {
    if (val === null || val === undefined) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    if (typeof val === "boolean" && SHOW_ONLY_WHEN_TRUE.has(key) && val === false) return true;
    return false;
  }

  // Only show dependent fields if the parent answer makes them relevant
  const DEPENDS_ON: Partial<Record<keyof FormData, (fd: FormData) => boolean>> = {
    enquiryId: (fd) => fd.topLevel !== "Other",
    specificDetailId: (fd) => fd.topLevel !== "Other",
    otherEnquiryText: (fd) => fd.topLevel === "Other",
    childrenCount: (fd) => fd.hasChildren,
    disabilityType: (fd) => fd.hasDisabilityOrSensory,
    safeToContact: (fd) => fd.domesticAbuse,
    safeContactNotes: (fd) => fd.domesticAbuse && fd.safeToContact === "no",
    urgentReason: (fd) => fd.urgent === "yes",
    urgentOtherReason: (fd) => fd.urgent === "yes" && fd.urgentReason === "Other",
    ageRange: (fd) => !fd.dob,
  };

  // Get the enquiry context which determines which questions were actually asked based on earlier answers
  const enquiryContext = useMemo(
    () => getEnquiryContext(formData),
    [
      formData.topLevel, 
      formData.generalServicesChoice, 
      formData.enquiryId, 
      formData.specificDetailId, 
      formData.otherEnquiryText],
  );

  // Only show questions that were displayed for the chosen enquiry
  const ASKED_IN_CONTEXT: Partial<Record<keyof FormData, (context: EnquiryContext) => boolean>> = {
    hasChildren: (context) => context.showChildrenQs,
    childrenCount: (context) => context.showChildrenQs,

    hasDisabilityOrSensory: (context) => context.showDisabilityQs,
    disabilityType: (context) => context.showDisabilityQs,

    householdSize: (context) => context.showHouseholdSize,

    domesticAbuse: (context) => context.showDomesticAbuseQs,
    safeToContact: (context) => context.showDomesticAbuseQs,
    safeContactNotes: (context) => context.showDomesticAbuseQs,
  };

  const STEP1_KEYS: ReadonlySet<keyof FormData> = new Set([
    "firstName",
    "lastName",
    "email",
    "phone",
    "dob",
    "contactMethod",
    "addressLine1",
    "addressLine2",
    "addressLine3",
    "townOrCity",
    "postcode",
  ]);

  function getReviewLabel(key: keyof FormData) {
    return reviewLabels[key] || String(key);
  }

  // For each field, determine if it should be shown on the review page, and if so return its display value
  function getDisplayValueForReview(key: keyof FormData): string | null {
    // If this field was not asked based on the enquiry context, don't show it on the review page at all
    const wasAsked = ASKED_IN_CONTEXT[key];
    if (wasAsked && !wasAsked(enquiryContext)) return null;

    // Only show the Step 1 fields if the user chose to provide details
    if (STEP1_KEYS.has(key) && formData.provideDetails !== "yes") return null;

    // If this field has a dependency and that dependency is not satisfied, don't show it on the review page
    const dep = DEPENDS_ON[key];
    if (dep && !dep(formData)) return null;

    let val: unknown = formData[key];

    // For some fields, we need to transform the stored value into a human-readable form for the review page
    if (key === "enquiryId") {
      val = enquiryContext.selectedEnquiry?.label || "";
    }

    // For the specificDetailId, we need to look up the label of the selected option within the
    // currently selected enquiry's specifics to make it human-readable on the review page
    if (key === "specificDetailId") {
      val = enquiryContext.selectedEnquiry?.specifics?.find((d) => d.value === formData.specificDetailId)?.label || "";
    }

    if (key === "urgent" && typeof val === "string") {
      val = URGENCY_LABELS[val] || val;
    }

    if (key === "safeToContact" && typeof val === "string") {
      val = SAFE_TO_CONTACT_LABELS[val] || val;
    }

    if (isEmptyForReview(key, val)) return null;

    return typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
  }

  // For each field, determine if it should be shown on the review page, and if so render it with the appropriate label and value
  function renderReviewItem(key: keyof FormData) {
    const label = getReviewLabel(key);
    const value = getDisplayValueForReview(key);
    if (value === null) return null;
    return <ReviewRow key={String(key)} label={label} value={value} />;
  }

  function buildSectionTts(title: string, pairs: Array<{ label: string; value: string }>) {
    const parts: string[] = [];
    parts.push(title);
    for (const p of pairs) {
      parts.push(p.label + ": " + p.value);
    }
    return parts.join(". ");
  }

  return (
    <StepShell
      step={3}
      totalSteps={3}
      title="Council service request"
      subtitle="Please review and submit"
      onBack={() => nav("/form/step-2")}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Step 3
        </Typography>

        <Typography variant="h6" sx={{ mb: 3 }}>
          Please review your information before submitting:
        </Typography>

        {/* Review items */}
        {SECTIONS.map((section) => {
          const pairs = section.keys
            .map((k) => {
              const value = getDisplayValueForReview(k);
              if (value === null) return null;
              return { label: getReviewLabel(k), value };
            })
            .filter(isNotNull);

          if (pairs.length === 0) return null;

          const ttsText = buildSectionTts(section.title, pairs);
          const items = section.keys.map((k) => renderReviewItem(k)).filter(isNotNull);

          return (
            <WithTTS key={section.title} copy={{ label: section.title, tts: ttsText }} titleVariant="h6" sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                <Button
                  type="button"
                  size="medium"
                  variant="text"
                  onClick={() => nav(section.editTo)}
                  sx={{ textTransform: "none" }}
                >
                  Edit
                </Button>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "calc(50% + 0px)",
                    width: "1px",
                    bgcolor: "grey.300",
                    pointerEvents: "none",
                  },
                }}
              >
                <Stack divider={<Divider flexItem />}>{items}</Stack>
              </Paper>
            </WithTTS>
          );
        })}

        {/* Navigation Buttons */}
        <StepActions
          onSave={handleSave}
          advanceLabel="Submit request"
          onAdvanceClick={submitToBackend}
          showPrevious
          onPrevious={() => nav("/form/step-2")}
        />
      </Paper>
    </StepShell>
  );
}

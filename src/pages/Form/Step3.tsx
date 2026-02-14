import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack, Divider, Box } from "@mui/material";
import StepShell from "./components/StepShell";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";
import type { FormData } from "./model/types";
import StepActions from "./components/StepActions";
import { useMemo, type ReactNode } from "react";
import { getEnquiryContext } from "./model/enquiriesContext";

type EnquiryContext = ReturnType<typeof getEnquiryContext>;

export default function Step3() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave, handleListenAll } = useFormWizard();

  // TODO(BACKEND)
  const submitToBackend = () => {
    const payload = {
      ...formData,
      childrenCount: formData.hasChildren ? formData.childrenCount : "0",
      disabilityType: formData.hasDisabilityOrSensory ? formData.disabilityType : "",
      urgentOtherReason: formData.urgentReason === "Other" ? formData.urgentOtherReason : "",
    };
    console.log(payload);
    alert("Submitted (mock)");
  };

  const reviewLabels: Partial<Record<keyof FormData, string>> = {
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone number",
    dob: "Date of birth",
    contactMethod: "Preferred method of contact",

    enquiryId: "Choose an enquiry",
    specificDetailId: "More detail",

    hasChildren: "I have dependent children",
    childrenCount: "How many children?",
    householdSize: "How many people are in your household?",
    hasDisabilityOrSensory: "I have a disability or sensory impairment",
    disabilityType: "Select a type...",
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

  const SECTIONS: Array<{
    title: string;
    keys: Array<keyof FormData>;
    editTo: "/form/step-1" | "/form/step-2";
  }> = [
    {
      title: "Your details",
      keys: ["firstName", "lastName", "dob", "email", "phone", "contactMethod"],
      editTo: "/form/step-1",
    },
    {
      title: "Your request",
      keys: ["enquiryId", "specificDetailId", "proceed", "additionalInfo"],
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

  function isNotNull(x: ReactNode): x is Exclude<ReactNode, null | undefined | false> {
    return x !== null && x !== undefined && x !== false;
  }

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

  function isEmptyForReview(key: keyof FormData, val: unknown) {
    if (val === null || val === undefined) return true;
    if (typeof val === "string" && val.trim() === "") return true;
    if (typeof val === "boolean" && SHOW_ONLY_WHEN_TRUE.has(key) && val === false) return true;
    return false;
  }

  const DEPENDS_ON: Partial<Record<keyof FormData, (fd: FormData) => boolean>> = {
    childrenCount: (fd) => fd.hasChildren,
    disabilityType: (fd) => fd.hasDisabilityOrSensory,
    safeToContact: (fd) => fd.domesticAbuse,
    safeContactNotes: (fd) => fd.domesticAbuse && fd.safeToContact === "no",
    urgentReason: (fd) => fd.urgent === "yes",
    urgentOtherReason: (fd) => fd.urgent === "yes" && fd.urgentReason === "Other",
  };

  const enquiryContext = useMemo(
    () => getEnquiryContext(formData),
    [formData.topLevel, formData.generalServicesChoice, formData.enquiryId, formData.specificDetailId],
  );

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
  ]);

  function renderReviewItem(key: keyof FormData) {
    const label = reviewLabels[key] || String(key);

    const wasAsked = ASKED_IN_CONTEXT[key];
    if (wasAsked && !wasAsked(enquiryContext)) return null;

    if (STEP1_KEYS.has(key) && formData.provideDetails !== "yes") return null;

    const dep = DEPENDS_ON[key];
    if (dep && !dep(formData)) return null;

    let val: unknown = formData[key];

    if (key === "enquiryId") {
      val = enquiryContext.selectedEnquiry?.label || "";
    }

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

    const displayValue = typeof val === "boolean" ? (val ? "Yes" : "No") : String(val);
    return <ReviewRow key={String(key)} label={label} value={displayValue} />;
  }

  return (
    <StepShell
      step={3}
      totalSteps={3}
      title="Council service request"
      subtitle="Please review and submit"
      onBack={() => nav("/form/step-2")}
      onListenAll={handleListenAll}
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

        {SECTIONS.map((section) => {
          const items = section.keys.map((k) => renderReviewItem(k)).filter(isNotNull);

          if (items.length === 0) return null;

          return (
            <Box key={section.title} sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                {section.title}
              </Typography>

              <Button
                type="button"
                size="medium"
                variant="text"
                onClick={() => nav(section.editTo)}
                sx={{ textTransform: "none" }}
              >
                Edit
              </Button>

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
            </Box>
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

/**
 * Review and submit
 *
 * Shows a summary of what has been entered so far, with links back to edit earlier steps.
 * Only relevant answers are shown (eg conditional questions that were actually asked, and values
 * that apply based on earlier choices).
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack, Divider, Box } from "@mui/material";
import StepShell from "../../components/FormPageComponents/StepShell";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";
import type { FormData } from "./model/types";
import StepActions from "../../components/FormPageComponents/StepActions";
import { getEnquiryContext } from "./model/enquiriesContext";
import { getReviewDisplayValue, getReviewLabel } from "./model/fieldMeta";

export default function ReviewAndSubmit() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave, clearSavedDraft } = useFormWizard();

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
    clearSavedDraft();
  };

  function isNotNull<T>(x: T | null | undefined | false): x is T {
    return x !== null && x !== undefined && x !== false;
  }

  const SECTIONS: Array<{
    title: string;
    keys: Array<keyof FormData>;
    editTo: "/form/personal-details" | "/form/enquiry-selection" | "/form/actions";
  }> = [
    {
      title: "Your details",
      keys: [
        "pronouns",
        "pronounsOther",
        "firstName",
        "middleName",
        "lastName",
        "preferredName",
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
      editTo: "/form/personal-details",
    },
    {
      title: "Your request",
      keys: ["enquiryId", "specificDetailId", "otherEnquiryText", "proceed", "additionalInfo"],
      editTo: "/form/enquiry-selection",
    },
    {
      title: "Urgency",
      keys: ["urgent", "urgentReason", "urgentOtherReason"],
      editTo: "/form/enquiry-selection",
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
      editTo: "/form/enquiry-selection",
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
        "supportNotes",
        "otherSupport",
      ],
      editTo: "/form/enquiry-selection",
    },
    {
      title: "Appointment",
      keys: ["appointmentDateIso", "appointmentTime"],
      editTo: "/form/actions",
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

  // Get the enquiry context which determines which questions were actually asked based on earlier answers
  const enquiryContext = useMemo(
    () => getEnquiryContext(formData),
    [
      formData.topLevel,
      formData.generalServicesChoice,
      formData.enquiryId,
      formData.specificDetailId,
      formData.otherEnquiryText,
    ],
  );

  // For each field, determine if it should be shown on the review page, and if so render it with the appropriate label and value
  function renderReviewItem(key: keyof FormData) {
    const label = getReviewLabel(key);
    const value = getReviewDisplayValue(key, formData, enquiryContext);
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
      step={4}
      totalSteps={4}
      title="Council service request"
      subtitle="Please review and submit"
      onBack={() => nav("/form/actions")}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Review and submit
        </Typography>

        <Typography variant="h6" sx={{ mb: 3 }}>
          Please review your information before submitting:
        </Typography>

        {/* Review items */}
        {SECTIONS.map((section) => {
          const pairs = section.keys
            .map((k) => {
              const value = getReviewDisplayValue(k, formData, enquiryContext);
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
          advanceType="button"
          showPrevious
          onPrevious={() => nav("/form/actions")}
        />

      </Paper>
    </StepShell>
  );
}

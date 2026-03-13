/**
 * Review and submit
 *
 * Shows a summary of what has been entered so far, with links back to edit earlier steps.
 * Only relevant answers are shown (eg conditional questions that were actually asked, and values
 * that apply based on earlier choices).
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack, Divider, Box, Alert } from "@mui/material";
import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "../../context/FormWizardProvider";
import type { FormData } from "./model/formFieldTypes";
import StepActions from "../../components/FormPageComponents/StepActions";
import { getEnquirySelectionState } from "./model/getEnquirySelectionState";
import { getReviewDisplayValue, getReviewLabel } from "./model/fieldMeta";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";
import { buildSubmitEnquiryPayload } from "./model/buildSubmitEnquiryPayload";
import { getDataAuthMode } from "../../utils/getDataAuthMode";
import { DepartmentLabelById } from "../../../shared/formSchema";

export default function ReviewAndSubmit() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave, clearSavedDraft } = useFormWizard();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const client = useMemo(() => generateClient<Schema>(), []);

  const submitToBackend = async () => {
    if (submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildSubmitEnquiryPayload(formData);

      const authMode = await getDataAuthMode();
      const response = await client.mutations.submitEnquiry({ input: payload }, { authMode });

      if (response?.errors?.length) {
        console.error("submitEnquiry returned errors", response.errors);
        setSubmitError("Submission failed. Please try again.");
        return;
      }

      const result = response?.data;
      if (!result?.ok) {
        setSubmitError(result?.errorMessage || "Submission failed. Please try again.");
        return;
      }

      if (!result.referenceNumber) {
        setSubmitError("Submission succeeded but no case reference was returned.");
        return;
      }

      const receiptType =
        formData.proceed === "BOOK_APPOINTMENT" ? "APPOINTMENT" : "QUEUE";

      clearSavedDraft();
      nav(`/receipts/${encodeURIComponent(result.referenceNumber)}`, {
        state: {
          receipt: {
            referenceNumber: result.referenceNumber,
            receiptType,
            ticketNumber: result.ticketNumber || undefined,
            appointmentDateIso: formData.appointmentDateIso || undefined,
            appointmentTime: formData.appointmentTime || undefined,
            departmentName: DepartmentLabelById[payload.departmentId],
          },
        },
      });
    } catch (e) {
      console.error("Failed to submit enquiry", e);
      setSubmitError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
      keys: ["urgent", "urgentReason"],
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
          gridTemplateColumns: { xs: "1fr", md: "minmax(260px, 1fr) minmax(260px, 1fr)" },
          gap: { xs: 0.5, md: 0 },
          py: 1.25,
          px: { xs: 0, sm: 2 },
          "&:hover": { bgcolor: { xs: "transparent", sm: "grey.50" } },
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "left", pr: { xs: 0, md: 2 }, minWidth: 0, fontWeight: 800 }}
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: { xs: "left", md: "right" },
            wordBreak: "break-word",
            flex: 1,
            fontWeight: 800,
            pl: { xs: 0, md: 2 },
          }}
        >
          {value}
        </Typography>
      </Box>
    );
  }

  // Get the enquiry selection state which determines which questions were actually asked based on earlier answers
  const enquirySelectionState = useMemo(() => getEnquirySelectionState(formData), [formData]);

  // For each field, determine if it should be shown on the review page, and if so render it with the appropriate label and value
  function renderReviewItem(key: keyof FormData) {
    const label = getReviewLabel(key);
    const value = getReviewDisplayValue(key, formData, enquirySelectionState);
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
    <FormStepLayout
      step={4}
      totalSteps={4}
      title="Council service request"
      subtitle="Please review and submit"
      onBack={() => nav("/form/actions")}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Paper variant="outlined" sx={{ p: { xs: 0, sm: 4 }, borderRadius: { xs: 0, sm: 2 }, borderWidth: { xs: 0, sm: 1 }, bgcolor: { xs: "transparent", sm: "background.paper" } }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Review and submit
        </Typography>

        <Typography variant="h6" sx={{ mb: 3 }}>
          Please review your information before submitting:
        </Typography>

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }} role="alert">
            {submitError}
          </Alert>
        )}

        {/* Review items */}
        {SECTIONS.map((section) => {
          const pairs = section.keys
            .map((k) => {
              const value = getReviewDisplayValue(k, formData, enquirySelectionState);
              if (value === null) return null;
              return { label: getReviewLabel(k), value };
            })
            .filter(isNotNull);

          if (pairs.length === 0) return null;

          const ttsText = buildSectionTts(section.title, pairs);
          const items = section.keys.map((k) => renderReviewItem(k)).filter(isNotNull);

          return (
            <WithTTS
              key={section.title}
              copy={{ label: section.title, tts: ttsText }}
              titleVariant="h6"
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", sm: "center" }, mb: 1 }}>
                <Button
                  type="button"
                  size="medium"
                  variant="text"
                  onClick={() => nav(section.editTo)}
                  sx={{ textTransform: "none", px: { xs: 0, sm: 1 } }}
                >
                  Edit
                </Button>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  borderRadius: { xs: 0, sm: 2 },
                  borderWidth: { xs: 0, sm: 1 },
                  position: "relative",
                  overflow: "hidden",
                  bgcolor: { xs: "transparent", sm: "background.paper" },
                  "&::before": {
                    content: { xs: "none", md: '""' },
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
          advanceDisabled={submitting}
          showPrevious
          onPrevious={() => nav("/form/actions")}
        />
      </Paper>
    </FormStepLayout>
  );
}

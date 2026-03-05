/**
 * Redirects to the last saved form step, or the first step if no draft exists.
 *
 * If a draft exists, this shows a choice to continue the saved form or start a new one.
 */

import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Button, Stack, Typography } from "@mui/material";

import FormStepLayout from "./FormStepLayout";
import { LANGUAGE_OPTIONS } from "../../pages/Form/data/languages";
import { clearDraft, loadDraft } from "../../pages/Form/model/draftStorage";
import { initialFormData } from "../../pages/Form/model/initialState";
import { useFormWizard } from "../../context/FormWizardProvider";

function formatSavedTime(ts: number) {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ResumeFromSave() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();

  const draft = loadDraft(localStorage);

  if (!draft) {
    return <Navigate to="/form/enquiry-selection" replace />;
  }

  const lastPath = draft.lastPath;
  const safeTarget = lastPath && lastPath.startsWith("/form/") ? lastPath : "/form/enquiry-selection";
  const savedAt = formatSavedTime(draft.updatedAt);

  const handleContinue = () => {
    setFormData(draft.data);
    nav(safeTarget, { replace: true });
  };

  const handleStartNew = () => {
    clearDraft(localStorage);
    setFormData(initialFormData);
    nav("/form/enquiry-selection", { replace: true });
  };

  return (
    <FormStepLayout
      step={1}
      totalSteps={4}
      title="Continue your saved form?"
      subtitle={savedAt ? `We found a saved form from ${savedAt}.` : "We found a saved form on this device."}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((prev) => ({ ...prev, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Stack spacing={3}>
        <Typography variant="body1">You can continue where you left off, or start a new form.</Typography>

        <Alert severity="info">Starting a new form will delete the saved answers on this device.</Alert>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button variant="contained" onClick={handleContinue}>
            Continue saved form
          </Button>
          <Button variant="outlined" onClick={handleStartNew}>
            Start new form
          </Button>
        </Stack>
      </Stack>
    </FormStepLayout>
  );
}

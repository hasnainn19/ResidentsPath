import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "../../context/FormWizardProvider";
import { clearDraft, formatSavedTime, getSafeDraftPath, loadDraft } from "./model/draftStorage";
import { initialFormData } from "./model/initialState";

export default function FormEntry() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();
  const draft = loadDraft(localStorage);
  const savedAt = draft ? formatSavedTime(draft.updatedAt) : "";

  const handleStartNew = () => {
    clearDraft(localStorage);
    setFormData({
      ...initialFormData,
      language: formData.language,
    });
    nav("/form/enquiry-selection");
  };

  const handleContinueSaved = () => {
    if (!draft) return;

    setFormData(draft.data);
    nav(getSafeDraftPath(draft.lastPath), { replace: true });
  };

  return (
    <FormStepLayout
      step={1}
      totalSteps={1}
      showProgress={false}
      title="Council service request"
      subtitle="Start a new enquiry or continue an existing case."
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((prev) => ({ ...prev, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        {draft ? (
          <Alert severity="info">
            {savedAt
              ? `We found a saved form from ${savedAt}. You can continue it or start again.`
              : "We found a saved form on this device. You can continue it or start again."}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gridAutoRows: "1fr",
            gap: { xs: 2, sm: 3 },
            alignItems: "stretch",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              height: "100%",
              p: { xs: 2.5, sm: 4 },
              borderRadius: { xs: 1.5, sm: 2 },
            }}
          >
            <Stack spacing={2} sx={{ width: "100%", height: "100%" }}>
              <Typography variant="h6" fontWeight={800}>
                Start a new enquiry
              </Typography>
              <Typography color="text.secondary" sx={{ minHeight: { md: 64 } }}>
                Complete the form to tell us what you need help with today.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: "auto" }}>
                <Button variant="contained" onClick={handleStartNew}>
                  Start a new enquiry
                </Button>
                {draft ? (
                  <Button variant="outlined" onClick={handleContinueSaved}>
                    Continue saved form
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              display: "flex",
              height: "100%",
              p: { xs: 2.5, sm: 4 },
              borderRadius: { xs: 1.5, sm: 2 },
            }}
          >
            <Stack spacing={2} sx={{ width: "100%", height: "100%" }}>
              <Typography variant="h6" fontWeight={800}>
                Continue an existing case
              </Typography>
              <Typography color="text.secondary" sx={{ minHeight: { md: 64 } }}>
                Use your case reference number to add an update, then join the queue or book an
                appointment.
              </Typography>
              <Box sx={{ mt: "auto" }}>
                <Button
                  variant="contained"
                  onClick={() => nav("/form/existing")}
                  sx={{ width: { xs: "100%", sm: "fit-content" } }}
                >
                  Continue an existing case
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </FormStepLayout>
  );
}

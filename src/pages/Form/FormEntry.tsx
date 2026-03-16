import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "../../context/FormWizardProvider";
import { clearDraft, formatSavedTime, getSafeDraftPath, loadDraft } from "./model/draftStorage";
import { initialFormData } from "./model/initialState";

export default function FormEntry() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();
  const {  t: translate } = useTranslation();
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
      title={translate("formentry-coun")}
      subtitle={translate("formentry-start")}
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
                {translate("formentry-startnew")}
              </Typography>
              <Typography color="text.secondary" sx={{ minHeight: { md: 64 } }}>
                {translate("formentry-complete")}
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: "auto" }}>
                <Button variant="contained" onClick={handleStartNew}>
                  {translate("formentry-startnew")}
                </Button>
                {draft ? (
                  <Button variant="outlined" onClick={handleContinueSaved}>
                    {translate("formentry-continue")}
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
                {translate("formentry-existing")}
              </Typography>
              <Typography color="text.secondary" sx={{ minHeight: { md: 64 } }}>
                {translate("formentry-use")}
              </Typography>
              <Box sx={{ mt: "auto" }}>
                <Button
                  variant="contained"
                  onClick={() => nav("/form/existing")}
                  sx={{ width: { xs: "100%", sm: "fit-content" } }}
                >
                  
                  {translate("formentry-existing")}
                </Button>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </FormStepLayout>
  );
}

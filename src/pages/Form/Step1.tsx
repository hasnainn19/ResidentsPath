import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack } from "@mui/material";
import StepShell from "./components/StepShell";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";

export default function Step1() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();

  const handleListenAll = () => alert("Reading instructions (mock)");

  return (
    <StepShell
      step={1}
      totalSteps={3}
      title="Council service request"
      subtitle="Please complete this form to help us support you today"
      onBack={() => nav("/")}
      onListenAll={handleListenAll}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Step 1 (placeholder)
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => nav("/form/step-2")}>
            Next
          </Button>
        </Stack>
      </Paper>
    </StepShell>
  );
}

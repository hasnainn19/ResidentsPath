import { useNavigate } from "react-router-dom";
import { Paper, Typography, Button, Stack } from "@mui/material";
import StepShell from "./components/StepShell";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";

export default function Step3() {
  const nav = useNavigate();
  const { formData, setFormData } = useFormWizard();

  const handleListenAll = () => alert("Reading instructions (mock)");
  const submit = () => {
    console.log("Submitting payload:", formData);
    alert("Submitted (mock)");
  };

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


        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => nav("/form/step-2")}>
            Previous
          </Button>
          <Button variant="contained" onClick={submit}>
            Submit
          </Button>
        </Stack>
      </Paper>
    </StepShell>
  );
}

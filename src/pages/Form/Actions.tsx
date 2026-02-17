/**
 * Actions and next steps.
 *
 * Shows:
 * - Self-service links (when available for the selected enquiry)
 * - Queue status
 * - Embedded booking panel when the resident chose to book an appointment
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Divider, List, ListItem, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import StepShell from "./components/StepShell";
import StepActions from "./components/StepActions";
import WithTTS from "./components/WithTTS";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "./context/FormWizardProvider";
import { getEnquiryContext } from "./model/enquiriesContext";
import BookingPanel from "../../components/BookingPanel";

export default function Actions() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

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

  const selectedEnquiry = enquiryContext.selectedEnquiry;
  const selfServiceLinks = selectedEnquiry?.selfServiceLinks || [];

  const showQueue = formData.proceed === "Join digital queue";
  const showBooking = formData.proceed === "Schedule appointment";

  const queueStubText = "Queue status";

  return (
    <StepShell
      step={3}
      totalSteps={4}
      title="Council service request"
      subtitle="Online options and next steps"
      onBack={() => nav("/form/enquiry-selection")}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
    >
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Actions and next steps
        </Typography>

        <Stack spacing={4}>
          {/* Self-service */}
          <WithTTS
            copy={{
              label: "Online self-service options",
              tts:
                selfServiceLinks.length > 0
                  ? "Online self-service options are available. Use the links to complete your request online."
                  : "No online self-service options are listed for this choice.",
            }}
            titleVariant="h6"
          >
            {selfServiceLinks.length > 0 ? (
              <List sx={{ pl: 0 }}>
                {selfServiceLinks.map((l) => (
                  <ListItem key={l.href} sx={{ px: 0 }}>
                    <Button
                      component="a"
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      sx={{ textTransform: "none" }}
                      fullWidth
                    >
                      {l.label}
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert
                severity="info"
                variant="outlined"
                sx={(theme) => {
                  const accent = theme.palette.primary.main;
                  return {
                    borderRadius: 2,
                    py: 1.5,
                    borderColor: accent,
                    bgcolor: alpha(accent, 0.08),
                    "& .MuiAlert-message": { width: "100%" },
                    "& svg": { color: accent },
                    color: theme.palette.primary.main,
                  };
                }}
              >
                No online options are listed for this enquiry yet.
              </Alert>
            )}
          </WithTTS>

          <Divider />

          {/* Queue */}
          {showQueue && (
            <WithTTS copy={{ label: "Digital queue status", tts: queueStubText }} titleVariant="h6">
              <Alert severity="warning" variant="outlined">
                {queueStubText}
              </Alert>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Queue status:
                </Typography>
              </Box>
            </WithTTS>
          )}

          {/* Booking */}
          {showBooking && (
            <WithTTS
              copy={{
                label: "Book an appointment",
                tts: "Book an appointment by selecting a date and time, then confirm.",
              }}
              titleVariant="h6"
            >
              <BookingPanel
                onConfirm={(dateIso, time) => {
                  setFormData((p) => ({
                    ...p,
                    appointmentDateIso: dateIso,
                    appointmentTime: time,
                  }));
                }}
              />
            </WithTTS>
          )}

          {/* Actions */}
          <StepActions
            onSave={handleSave}
            advanceLabel="Continue"
            advanceType="button"
            onAdvanceClick={() => nav("/form/review-and-submit")}
            showPrevious
            onPrevious={() => nav("/form/enquiry-selection")}
          />
        </Stack>
      </Paper>
    </StepShell>
  );
}

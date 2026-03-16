/**
 * Actions and next steps.
 *
 * Shows:
 * - Queue status and next steps for joining the digital queue
 * - Embedded booking panel when the resident chooses to book an appointment
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Paper, Stack, Typography, Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { generateClient } from "aws-amplify/data";

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import StepActions from "../../components/FormPageComponents/StepActions";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import { useFormWizard } from "../../context/FormWizardProvider";
import BookingPanel from "../../components/BookingPanel";
import { getEnquirySelectionState } from "./model/getEnquirySelectionState";
import type { Schema } from "../../../amplify/data/resource";
import type { BusyLevel, QueueStatus } from "./model/formFieldTypes";
import { getDataAuthMode } from "../../utils/getDataAuthMode";

function formatTimeGb(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
}

function busyFromQueueCount(queueCount: number): BusyLevel {
  if (queueCount <= 3) return "quiet";
  if (queueCount <= 8) return "average";
  if (queueCount <= 15) return "busy";
  return "veryBusy";
}

function busyLabel(level: BusyLevel): string {
  if (level === "quiet") return "Quiet";
  if (level === "average") return "Average";
  if (level === "busy") return "Busy";
  return "Very busy";
}

function busySeverity(level: BusyLevel): "success" | "info" | "warning" | "error" {
  if (level === "quiet") return "success";
  if (level === "average") return "info";
  if (level === "busy") return "warning";
  return "error";
}

function buildQueueCountText(queueCount: number): string {
  if (queueCount === 0) {
    return "There is currently nobody in this queue.";
  }

  if (queueCount === 1) {
    return "There is currently 1 person in this queue.";
  }

  return `There are currently ${queueCount} people in this queue.`;
}

function buildQueueBusyText(level: BusyLevel): string {
  return `Current queue level: ${busyLabel(level)}.`;
}

function buildQueueTts(status: QueueStatus, level: BusyLevel): string {
  return (
    `Queue information. ` +
    `${buildQueueCountText(status.queueCount)} ` +
    `${buildQueueBusyText(level)} ` +
    `Last updated at ${formatTimeGb(new Date(status.updatedAtIso))}. ` +
    `Some urgent or vulnerable cases may be seen sooner.`
  );
}

export default function Actions() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();
  const client = useMemo(() => generateClient<Schema>(), []);

  const showQueue = formData.proceed === "JOIN_DIGITAL_QUEUE";
  const showBooking = formData.proceed === "BOOK_APPOINTMENT";
  const enquirySelectionState = useMemo(() => getEnquirySelectionState(formData), [formData]);
  const selectedDepartmentId =
    formData.routedDepartment || enquirySelectionState.selectedEnquiry?.department;
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueStatusLoading, setQueueStatusLoading] = useState(false);
  const [queueStatusError, setQueueStatusError] = useState<string | null>(null);
  const busy = busyFromQueueCount(queueStatus?.queueCount ?? 0);

  useEffect(() => {
    let cancelled = false;

    async function loadQueueStatus() {
      if (!showQueue || !selectedDepartmentId) {
        setQueueStatus(null);
        setQueueStatusError(null);
        setQueueStatusLoading(false);
        return;
      }

      setQueueStatusLoading(true);
      setQueueStatusError(null);

      try {
        const authMode = await getDataAuthMode();
        const response = await client.queries.getDepartmentQueueStatus(
          { departmentId: selectedDepartmentId },
          { authMode },
        );

        if (cancelled) {
          return;
        }

        if (response.errors?.length || !response.data) {
          console.error("getDepartmentQueueStatus returned errors", response.errors);
          setQueueStatus(null);
          setQueueStatusError("Unable to load the current queue size right now.");
          setQueueStatusLoading(false);
          return;
        }

        setQueueStatus({
          queueCount: Math.max(0, response.data.queueCount ?? 0),
          updatedAtIso: response.data.updatedAtIso || new Date().toISOString(),
        });
        setQueueStatusLoading(false);
      } catch (error) {
        console.error("Failed to load queue status", error);

        if (cancelled) {
          return;
        }

        setQueueStatus(null);
        setQueueStatusError("Unable to load the current queue size right now.");
        setQueueStatusLoading(false);
      }
    }

    loadQueueStatus();

    return () => {
      cancelled = true;
    };
  }, [client, selectedDepartmentId, showQueue]);

  const bookingIncomplete =
    showBooking &&
    (formData.appointmentDateIso.trim() === "" || formData.appointmentTime.trim() === "");

  return (
    <FormStepLayout
      step={3}
      totalSteps={4}
      title="Council service request"
      subtitle="Next steps"
      onBack={() => nav("/form/personal-details")}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 0, sm: 4 },
          borderRadius: { xs: 0, sm: 2 },
          borderWidth: { xs: 0, sm: 1 },
          bgcolor: { xs: "transparent", sm: "background.paper" },
        }}
      >
        <Typography fontWeight={800} sx={{ mb: 2 }}>
          Actions and next steps
        </Typography>

        <Stack spacing={4}>
          {/* Queue */}
          {showQueue && (
            <WithTTS
              copy={{
                label: "Digital queue information",
                tts: queueStatus
                  ? buildQueueTts(queueStatus, busy)
                  : queueStatusLoading
                    ? "Queue status is loading."
                    : "Queue status is unavailable right now.",
              }}
              titleVariant="h6"
            >
              <Stack spacing={2}>
                {!selectedDepartmentId ? (
                  <Alert severity="info" variant="outlined">
                    Select a service to see the current queue size.
                  </Alert>
                ) : queueStatusLoading ? (
                  <Alert
                    severity="info"
                    variant="outlined"
                    sx={(theme) => {
                      const accent = theme.palette.primary.main;

                      return {
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: accent,
                        borderLeftWidth: 8,
                        bgcolor: alpha(accent, 0.1),
                        "& .MuiAlert-icon": { color: accent },
                        "& .MuiAlert-message": { width: "100%" },
                      };
                    }}
                  >
                    Loading the current queue information...
                  </Alert>
                ) : queueStatusError ? (
                  <Alert severity="warning" variant="outlined">
                    {queueStatusError}
                  </Alert>
                ) : queueStatus ? (
                  <Alert
                    severity={busySeverity(busy)}
                    variant="outlined"
                    sx={(theme) => {
                      const pal = theme.palette[busySeverity(busy)];
                      const accent = pal.dark || pal.main;

                      return {
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: accent,
                        borderLeftWidth: 8,
                        bgcolor: alpha(accent, 0.1),
                        "& .MuiAlert-icon": { color: accent },
                        "& .MuiAlert-message": { width: "100%" },
                      };
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography fontWeight={800}>
                        {buildQueueCountText(queueStatus.queueCount)}
                      </Typography>
                      <Typography variant="body2">{buildQueueBusyText(busy)}</Typography>
                      <Typography variant="body2">
                        Last updated: {formatTimeGb(new Date(queueStatus.updatedAtIso))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Some urgent or vulnerable cases may be seen sooner.
                      </Typography>
                    </Stack>
                  </Alert>
                ) : null}

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography fontWeight={800}>Join the digital queue</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Continue to review your details, then submit the form to join the queue.
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Alert severity="warning" variant="outlined">
                  If you feel unsafe or need urgent help today, speak to reception staff now.
                </Alert>
              </Stack>
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
                departmentId={selectedDepartmentId || undefined}
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
            advanceDisabled={bookingIncomplete}
            showPrevious
            onPrevious={() => nav("/form/personal-details")}
          />
        </Stack>
      </Paper>
    </FormStepLayout>
  );
}

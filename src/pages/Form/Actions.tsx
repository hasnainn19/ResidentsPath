/**
 * Actions and next steps.
 *
 * Shows:
 * - Queue status and option to join the digital queue or get a reminder to join later
 * - Embedded booking panel when the resident chooses to book an appointment
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { generateClient } from "aws-amplify/data";

import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import StepActions from "../../components/FormPageComponents/StepActions";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import OptionTile from "../../components/FormPageComponents/OptionTile";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "../../context/FormWizardProvider";
import BookingPanel from "../../components/BookingPanel";
import { getEnquirySelectionState } from "./model/getEnquirySelectionState";
import type { Schema } from "../../../amplify/data/resource";
import type { BusyLevel, QueueStatus } from "./model/formFieldTypes";
import { getDataAuthMode } from "../../utils/getDataAuthMode";

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function roundUpToMinutes(d: Date, minutes: number): Date {
  const ms = minutes * 60 * 1000;
  return new Date(Math.ceil(d.getTime() / ms) * ms);
}

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

// Create time options for the "Remind me to join later" feature
function buildTimeOptionsToday(now: Date, limitHoursAhead: number): string[] {
  const start = roundUpToMinutes(now, 15);
  const end = new Date(now.getTime() + limitHoursAhead * 60 * 60 * 1000);

  const out: string[] = [];
  let cur = start;

  while (cur.getDate() === now.getDate() && cur <= end) {
    out.push(
      `${String(cur.getHours()).padStart(2, "0")}:${String(cur.getMinutes()).padStart(2, "0")}`,
    );
    cur = new Date(cur.getTime() + 15 * 60 * 1000);
  }

  return out;
}

export default function Actions() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();
  const client = useMemo(() => generateClient<Schema>(), []);

  const showQueue = formData.proceed === "JOIN_DIGITAL_QUEUE";
  const showBooking = formData.proceed === "BOOK_APPOINTMENT";
  const enquirySelectionState = useMemo(() => getEnquirySelectionState(formData), [formData]);
  const selectedDepartmentName =
    formData.routedDepartment || enquirySelectionState.selectedEnquiry?.department;
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [queueStatusLoading, setQueueStatusLoading] = useState(false);
  const [queueStatusError, setQueueStatusError] = useState<string | null>(null);
  const busy = busyFromQueueCount(queueStatus?.queueCount ?? 0);

  const [joinTiming, setJoinTiming] = useState<"now" | "later">("now");
  const timeOptionsToday = useMemo(() => buildTimeOptionsToday(new Date(), 8), []);
  const [laterTimeToday, setLaterTimeToday] = useState<string>(timeOptionsToday[0] ?? "");
  const [confirmReminderOpen, setConfirmReminderOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQueueStatus() {
      if (!showQueue || !selectedDepartmentName) {
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
          { departmentName: selectedDepartmentName },
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
  }, [client, selectedDepartmentName, showQueue]);

  const hasReminderContact =
    formData.provideDetails === "yes" &&
    (formData.phone.trim() !== "" || formData.email.trim() !== "");

  const bookingIncomplete =
    showBooking &&
    (formData.appointmentDateIso.trim() === "" || formData.appointmentTime.trim() === "");

  // Compute the time for the reminder based on the user's selection
  const computedReminderAt = useMemo(() => {
    if (joinTiming !== "later") return null;

    const now = new Date();

    // If no valid time is selected, default to 15 mins from now
    if (!laterTimeToday || !laterTimeToday.includes(":")) {
      return roundUpToMinutes(now, 15);
    }

    // Clamp the selected time to valid hours and minutes
    const [hhRaw, mmRaw] = laterTimeToday.split(":");
    const hh = clampInt(Number(hhRaw), 0, 23);
    const mm = clampInt(Number(mmRaw), 0, 59);

    const d = new Date(now);
    d.setHours(hh, mm, 0, 0);

    // If a past time slips through, snap to the next 15-min slot
    if (d.getTime() <= now.getTime()) return roundUpToMinutes(now, 15);

    return d;
  }, [joinTiming, laterTimeToday]);

  function handleSetReminder() {
    if (!computedReminderAt) return;
    setConfirmReminderOpen(true);
  }

  function handleConfirmReminder() {
    if (!computedReminderAt) return;

    // TODO: Replace this with a backend call that schedules an SMS/email reminder
    setConfirmReminderOpen(false);
    handleSave();
  }

  function handleCancelReminder() {
    setConfirmReminderOpen(false);
  }

  return (
    <FormStepLayout
      step={3}
      totalSteps={4}
      title="Council service request"
      subtitle="Next steps"
      onBack={() => nav("/form/personal-details")}
      languageValue={formData.language}
      onLanguageChange={(code) => setFormData((p) => ({ ...p, language: code }))}
      languageOptions={LANGUAGE_OPTIONS}
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
                {!selectedDepartmentName ? (
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
                      <Typography fontWeight={800}>When do you want to join?</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Joining later sends a reminder. It does not reserve a place in the queue.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                      }}
                    >
                      <OptionTile
                        title="Join now"
                        description="Continue and join the digital queue now."
                        selected={joinTiming === "now"}
                        onClick={() => setJoinTiming("now")}
                      />
                      <OptionTile
                        title="Remind me to join later"
                        description="Get an SMS or email reminder to join later."
                        selected={joinTiming === "later"}
                        onClick={() => setJoinTiming("later")}
                      />
                    </Box>

                    <Collapse in={joinTiming === "later"} timeout="auto" unmountOnExit>
                      <Stack spacing={1.5} sx={{ pt: 1 }}>
                        <Typography fontWeight={800}>Choose a time today</Typography>

                        <FormControl size="small" fullWidth>
                          <InputLabel id="remind-time-today-label">Choose a time today</InputLabel>
                          <Select
                            labelId="remind-time-today-label"
                            label="Choose a time today"
                            value={laterTimeToday}
                            onChange={(e) => setLaterTimeToday(String(e.target.value))}
                          >
                            {timeOptionsToday.length > 0 ? (
                              timeOptionsToday.map((t) => (
                                <MenuItem key={t} value={t}>
                                  {t}
                                </MenuItem>
                              ))
                            ) : (
                              <MenuItem value="" disabled>
                                No times available
                              </MenuItem>
                            )}
                          </Select>
                        </FormControl>

                        {!hasReminderContact ? (
                          <Alert severity="info" variant="outlined">
                            To get a reminder, add a phone number or email in Step 2.
                          </Alert>
                        ) : null}

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          justifyContent="space-between"
                        >
                          <Typography variant="body2" color="text.secondary">
                            {computedReminderAt
                              ? `Reminder time: ${formatTimeGb(computedReminderAt)}`
                              : ""}
                          </Typography>

                          <Button
                            variant="contained"
                            onClick={handleSetReminder}
                            disabled={!hasReminderContact || !computedReminderAt}
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                          >
                            Set reminder
                          </Button>
                        </Stack>
                      </Stack>
                    </Collapse>
                  </Stack>
                </Paper>

                <Alert severity="warning" variant="outlined">
                  If you feel unsafe or need urgent help today, speak to reception staff now.
                </Alert>
              </Stack>

              <Dialog
                open={confirmReminderOpen}
                onClose={handleCancelReminder}
                aria-labelledby="confirm-reminder-title"
              >
                <DialogTitle id="confirm-reminder-title">Confirm reminder</DialogTitle>

                <DialogContent>
                  <DialogContentText>
                    {computedReminderAt
                      ? `Set a reminder for ${formatTimeGb(computedReminderAt)}? This does not reserve a place in the queue.`
                      : "Set this reminder? This does not reserve a place in the queue."}
                  </DialogContentText>
                </DialogContent>

                <DialogActions>
                  <Button onClick={handleCancelReminder}>Cancel</Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirmReminder}
                    disabled={!computedReminderAt}
                  >
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>
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
                departmentName={selectedDepartmentName || undefined}
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
            advanceDisabled={(showQueue && joinTiming === "later") || bookingIncomplete}
            showPrevious
            onPrevious={() => nav("/form/personal-details")}
          />
        </Stack>
      </Paper>
    </FormStepLayout>
  );
}

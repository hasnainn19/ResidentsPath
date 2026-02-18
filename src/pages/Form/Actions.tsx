/**
 * Actions and next steps.
 *
 * Shows:
 * - Self-service links (when available for the selected enquiry)
 * - Queue status and option to join the digital queue or get a reminder to join later
 * - Embedded booking panel when the resident chooses to book an appointment
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Divider,
  List,
  ListItem,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Box,
  ButtonBase,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import StepShell from "../../components/FormPageComponents/StepShell";
import StepActions from "../../components/FormPageComponents/StepActions";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import { LANGUAGE_OPTIONS } from "./data/languages";
import { useFormWizard } from "../../context/FormWizardProvider";
import { getEnquirySelectionState } from "./model/getEnquirySelectionState";
import BookingPanel from "../../components/BookingPanel";
import type { BusyLevel, QueueStatus, OptionTileProps } from "./model/formFieldTypes";

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

function busyFromTypicalWait(mins: number): BusyLevel {
  if (mins < 30) return "quiet";
  if (mins <= 60) return "average";
  if (mins <= 120) return "busy";
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

function buildQueueTts(status: QueueStatus, level: BusyLevel): string {
  return (
    `Queue status. ` +
    `Hounslow House is ${busyLabel(level).toLowerCase()} right now. ` +
    `Typical wait is about ${status.typicalWaitMin} to ${status.typicalWaitMax} minutes. ` +
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
    out.push(`${String(cur.getHours()).padStart(2, "0")}:${String(cur.getMinutes()).padStart(2, "0")}`);
    cur = new Date(cur.getTime() + 15 * 60 * 1000);
  }

  return out;
}

// A tile component for selecting options (e.g. join queue now vs later)
function OptionTile({ title, description, selected, onClick }: OptionTileProps) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: "100%",
        textAlign: "left",
        borderRadius: 2,
      }}
    >
      <Box
        sx={(theme) => {
          const accent = theme.palette.primary.main;
          return {
            width: "100%",
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: selected ? accent : theme.palette.divider,
            bgcolor: selected ? alpha(accent, 0.08) : "transparent",
            transition: "border-color 120ms ease, background-color 120ms ease",
          };
        }}
      >
        <Typography fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

function getQueueStatusStub(): QueueStatus {
  const now = new Date();
  return {
    typicalWaitMin: 45,
    typicalWaitMax: 75,
    updatedAtIso: now.toISOString(),
  };
}

export default function Actions() {
  const nav = useNavigate();
  const { formData, setFormData, handleSave } = useFormWizard();

  const enquirySelectionState = useMemo(
    () => getEnquirySelectionState(formData), [formData]);

  const selectedEnquiry = enquirySelectionState.selectedEnquiry;
  const selfServiceLinks = selectedEnquiry?.selfServiceLinks || [];

  const showQueue = formData.proceed === "Join digital queue";
  const showBooking = formData.proceed === "Schedule appointment";

  const queueStatus = useMemo(() => getQueueStatusStub(), []);
  const typicalMid = Math.round((queueStatus.typicalWaitMin + queueStatus.typicalWaitMax) / 2);
  const busy = busyFromTypicalWait(typicalMid);

  const [joinTiming, setJoinTiming] = useState<"now" | "later">("now");
  const timeOptionsToday = useMemo(() => buildTimeOptionsToday(new Date(), 8), []);
  const [laterTimeToday, setLaterTimeToday] = useState<string>(timeOptionsToday[0] ?? "");
  const [confirmReminderOpen, setConfirmReminderOpen] = useState(false);

  const hasReminderContact =
    formData.provideDetails === "yes" && (formData.phone.trim() !== "" || formData.email.trim() !== "");

  const bookingIncomplete = showBooking && (formData.appointmentDateIso.trim() === "" || formData.appointmentTime.trim() === "");

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
            <WithTTS
              copy={{
                label: "Digital queue status",
                tts: buildQueueTts(queueStatus, busy),
              }}
              titleVariant="h6"
            >
              <Stack spacing={2}>
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
                    <Typography fontWeight={800}>The queue is currently: {busyLabel(busy)}</Typography>
                    <Typography variant="body2">
                      Typical wait if you join now: {queueStatus.typicalWaitMin} to {queueStatus.typicalWaitMax} minutes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Some urgent or vulnerable cases may be seen sooner.
                    </Typography>
                  </Stack>
                </Alert>

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
                        gridTemplateColumns: "1fr 1fr",
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
                            To get a reminder, add a phone number or email in Step 1.
                          </Alert>
                        ) : null}

                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">
                            {computedReminderAt ? `Reminder time: ${formatTimeGb(computedReminderAt)}` : ""}
                          </Typography>

                          <Button
                            variant="contained"
                            onClick={handleSetReminder}
                            disabled={!hasReminderContact || !computedReminderAt}
                            sx={{ whiteSpace: "nowrap" }}
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
                  <Button variant="contained" onClick={handleConfirmReminder} disabled={!computedReminderAt}>
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
            onPrevious={() => nav("/form/enquiry-selection")}
          />
        </Stack>
      </Paper>
    </StepShell>
  );
}

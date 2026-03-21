import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { generateClient } from "aws-amplify/data";

import type { Schema } from "../../../amplify/data/resource";
import FormStepLayout from "../../components/FormPageComponents/FormStepLayout";
import LongTextSection from "../../components/FormPageComponents/LongTextSection";
import OptionTile from "../../components/FormPageComponents/OptionTile";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import BookingPanel from "../../components/BookingPanel";
import { FIELD_META } from "./model/fieldMeta";
import type { Proceed } from "./model/formFieldTypes";
import {
  FIELD_TEXT_CONSTRAINTS,
  isValidCaseReferenceNumber,
  normaliseCaseReferenceNumber,
  type DepartmentName,
} from "../../../shared/formSchema";
import { getDataAuthMode } from "../../utils/getDataAuthMode";

type CaseLookup = {
  referenceNumber: string;
  departmentName: DepartmentName;
  hasActiveWaitingTicket: boolean;
  hasReachedAppointmentLimit: boolean;
};

export default function ExistingCaseFollowUp() {
  const nav = useNavigate();
  const client = useMemo(() => generateClient<Schema>(), []);

  const [referenceNumber, setReferenceNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<CaseLookup | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [caseUpdate, setCaseUpdate] = useState("");
  const [proceed, setProceed] = useState<Proceed>("");
  const [appointmentDateIso, setAppointmentDateIso] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetProceedState = () => {
    setSubmitError(null);
    setProceed("");
    setAppointmentDateIso("");
    setAppointmentTime("");
  };

  const handleReferenceChange = (value: string) => {
    setReferenceNumber(value.toUpperCase());
    setLookupResult(null);
    setLookupError(null);
    setCaseUpdate("");
    resetProceedState();
  };

  // Try to find the case related to the entered reference number
  const handleLookup = async () => {
    const cleanedReferenceNumber = normaliseCaseReferenceNumber(referenceNumber);
    if (typeof cleanedReferenceNumber !== "string") {
      setLookupResult(null);
      setLookupError("Enter a case reference number.");
      return;
    }

    if (!isValidCaseReferenceNumber(cleanedReferenceNumber)) {
      setLookupResult(null);
      setLookupError("Enter a valid case reference number.");
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    resetProceedState();

    try {
      const authMode = await getDataAuthMode();
      const response = await client.queries.getCaseFollowUp(
        { referenceNumber: cleanedReferenceNumber },
        { authMode },
      );

      if (response.errors?.length) {
        console.error("getCaseFollowUp returned errors", response.errors);
        setLookupError(response.errors[0]?.message || "We could not load that case right now.");
        return;
      }

      const data = response.data;

      if (!data?.found || !data.referenceNumber || !data.departmentName) {
        setLookupError(
          data?.errorMessage || "We could not find a case with that reference number.",
        );
        return;
      }

      setLookupResult({
        referenceNumber: data.referenceNumber,
        departmentName: data.departmentName as DepartmentName,
        hasActiveWaitingTicket: !!data.hasActiveWaitingTicket,
        hasReachedAppointmentLimit: !!data.hasReachedAppointmentLimit,
      });
      setReferenceNumber(data.referenceNumber);
    } catch (error) {
      console.error("Failed to look up case follow-up", error);
      setLookupError("We could not load that case right now.");
    } finally {
      setLookupLoading(false);
    }
  };

  const queueUnavailable = !!lookupResult?.hasActiveWaitingTicket;
  const appointmentUnavailable = !!lookupResult?.hasReachedAppointmentLimit;
  const bookingIncomplete =
    proceed === "BOOK_APPOINTMENT" && (!appointmentDateIso.trim() || !appointmentTime.trim());

  const canSubmit =
    !!lookupResult &&
    !!proceed &&
    !bookingIncomplete &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (!proceed) {
        setSubmitError("Choose how you want to proceed.");
      } else if (bookingIncomplete) {
        setSubmitError("Choose an appointment date and time.");
      }
      return;
    }

    const activeCase = lookupResult!;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const authMode = await getDataAuthMode();
      const response = await client.mutations.submitCaseFollowUp(
        {
          input: {
            referenceNumber: activeCase.referenceNumber,
            caseUpdate: caseUpdate.trim() || undefined,
            proceed,
            appointmentDateIso: proceed === "BOOK_APPOINTMENT" ? appointmentDateIso : undefined,
            appointmentTime: proceed === "BOOK_APPOINTMENT" ? appointmentTime : undefined,
          },
        },
        { authMode },
      );

      if (response.errors?.length) {
        console.error("submitCaseFollowUp returned errors", response.errors);
        setSubmitError(response.errors[0]?.message || "Submission failed. Please try again.");
        return;
      }

      const result = response.data;

      if (!result?.ok || !result.referenceNumber) {
        setSubmitError(result?.errorMessage || "Submission failed. Please try again.");
        return;
      }

      // Navigate to the receipt page
      nav(`/receipts/${encodeURIComponent(result.referenceNumber)}`, {
        state: {
          receipt: {
            referenceNumber: result.referenceNumber,
            bookingReferenceNumber: result.bookingReferenceNumber || undefined,
            receiptType: proceed === "BOOK_APPOINTMENT" ? "APPOINTMENT" : "QUEUE",
            ticketNumber: result.ticketNumber || undefined,
            estimatedWaitTimeLower: result.estimatedWaitTimeLower ?? undefined,
            estimatedWaitTimeUpper: result.estimatedWaitTimeUpper ?? undefined,
            appointmentDateIso: proceed === "BOOK_APPOINTMENT" ? appointmentDateIso : undefined,
            appointmentTime: proceed === "BOOK_APPOINTMENT" ? appointmentTime : undefined,
            departmentName: activeCase.departmentName,
          },
        },
      });
    } catch (error) {
      console.error("Failed to submit case follow-up", error);
      setSubmitError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormStepLayout
      step={1}
      totalSteps={1}
      showProgress={false}
      title="Council service request"
      subtitle="Use your case reference number to add an update, then join the queue or book an appointment."
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={{ xs: 3, sm: 4 }}>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleLookup();
            }}
          >
            <WithTTS
              copy={{
                label: "Case reference number",
                tts: "Enter your case reference number, then select find case.",
              }}
              required
              titleVariant="subtitle1"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
                  gap: 2,
                  alignItems: "start",
                }}
              >
                <TextField
                  label="Case reference number"
                  value={referenceNumber}
                  onChange={(e) => handleReferenceChange(e.target.value)}
                  onBlur={() => {
                    const cleaned = normaliseCaseReferenceNumber(referenceNumber);
                    if (typeof cleaned === "string") {
                      setReferenceNumber(cleaned);
                    }
                  }}
                  placeholder="e.g. ABC-234DEF"
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      maxLength: 20,
                      autoCapitalize: "characters",
                      spellCheck: false,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={lookupLoading}
                  sx={{ minWidth: { sm: 180 } }}
                >
                  {lookupLoading ? "Finding case..." : "Find case"}
                </Button>
              </Box>
            </WithTTS>
          </Box>

          {lookupError ? <Alert severity="error">{lookupError}</Alert> : null}

          {lookupResult ? (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <Stack spacing={{ xs: 3, sm: 4 }}>
                <Alert
                  severity="success"
                  variant="outlined"
                  sx={({ palette }) => {
                    const accent = palette.success.dark;

                    return {
                      borderRadius: 2,
                      border: "2px solid",
                      borderColor: accent,
                      borderLeftWidth: 8,
                      bgcolor: alpha(accent, 0.12),
                      color: "text.primary",
                      "& .MuiAlert-icon": { color: accent },
                      "& .MuiAlert-message": { width: "100%" },
                    };
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography fontWeight={800}>
                      Case found: {lookupResult.referenceNumber}
                    </Typography>
                    <Typography variant="body2">
                      Service area: {lookupResult.departmentName || "Unknown service"}
                    </Typography>
                  </Stack>
                </Alert>

                {queueUnavailable ? (
                  <Alert
                    severity="info"
                    variant="outlined"
                    sx={({ palette }) => {
                      const accent = palette.primary.main;

                      return {
                        borderRadius: 2,
                        border: "2px solid",
                        borderColor: accent,
                        borderLeftWidth: 8,
                        bgcolor: alpha(accent, 0.08),
                        color: "text.primary",
                        "& .MuiAlert-icon": { color: accent },
                        "& .MuiAlert-message": { width: "100%" },
                      };
                    }}
                  >
                    {appointmentUnavailable
                      ? "This case is already in the queue, so you cannot create another ticket right now."
                      : "This case is already in the queue, so you can only book an appointment right now."}
                  </Alert>
                ) : null}

                {appointmentUnavailable ? (
                  <Alert severity="warning" variant="outlined">
                    This case already has two appointments booked online. Please contact us if you
                    need another appointment.
                  </Alert>
                ) : null}

                <LongTextSection
                  copy={{
                    label: "Add new information (optional)",
                    tts: "Add new information to this case if there is anything new that staff should know.",
                  }}
                  value={caseUpdate}
                  onChange={(value) => {
                    setCaseUpdate(value);
                    setSubmitError(null);
                  }}
                  maxLength={FIELD_TEXT_CONSTRAINTS.caseUpdate.maxLen}
                  minRows={5}
                  placeholder="Add any new details that might help with this case..."
                />

                <Box sx={{ pt: 1 }}>
                  <Divider sx={{ mb: 3 }} />

                  <WithTTS
                    copy={{
                      label: FIELD_META.proceed.label,
                      tts: "How would you like to proceed? Select join the digital queue or book an appointment.",
                    }}
                    required
                    titleVariant="subtitle1"
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 1.5,
                      }}
                    >
                      <OptionTile
                        title="Join digital queue"
                        description="Create a new queue ticket for this case."
                        selected={proceed === "JOIN_DIGITAL_QUEUE"}
                        disabled={queueUnavailable}
                        onClick={() => {
                          if (queueUnavailable) return;
                          setProceed("JOIN_DIGITAL_QUEUE");
                          setAppointmentDateIso("");
                          setAppointmentTime("");
                          setSubmitError(null);
                        }}
                      />
                      <OptionTile
                        title="Book appointment"
                        description="Book a new appointment for this case."
                        selected={proceed === "BOOK_APPOINTMENT"}
                        disabled={appointmentUnavailable}
                        onClick={() => {
                          if (appointmentUnavailable) return;
                          setProceed("BOOK_APPOINTMENT");
                          setSubmitError(null);
                        }}
                      />
                    </Box>
                  </WithTTS>
                </Box>

                {proceed === "BOOK_APPOINTMENT" ? (
                  <WithTTS
                    copy={{
                      label: "Book an appointment",
                      tts: "Book an appointment by selecting a date and time, then confirm.",
                    }}
                    titleVariant="h6"
                  >
                    <BookingPanel
                      departmentName={lookupResult.departmentName}
                      onConfirm={(dateIso, time) => {
                        setAppointmentDateIso(dateIso);
                        setAppointmentTime(time);
                        setSubmitError(null);
                      }}
                    />
                  </WithTTS>
                ) : null}

                {submitError ? <Alert severity="error">{submitError}</Alert> : null}

                <Box sx={{ pt: 2 }}>
                  <Divider sx={{ mb: { xs: 2.5, sm: 3 } }} />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1.5, sm: 2 }}>
                    <Button type="button" variant="outlined" onClick={() => nav("/form")} fullWidth>
                      Back
                    </Button>
                    <Button type="submit" variant="contained" disabled={!canSubmit} fullWidth>
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Paper>
    </FormStepLayout>
  );
}

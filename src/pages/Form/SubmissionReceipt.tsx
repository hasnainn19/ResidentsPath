/**
 * Submission Receipt
 *
 * Shows a receipt of the case reference number, ticket number (if joined queue), appointment details (if booked)
 * and a QR code that contains the necessary information to check queue status or show appointment details at reception.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import * as QRCode from "qrcode";
import { generateClient } from "aws-amplify/data";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import type { Schema } from "../../../amplify/data/resource";
import NavBar from "../../components/NavBar";
import WithTTS from "../../components/FormPageComponents/WithTTS";
import { getDataAuthMode } from "../../utils/getDataAuthMode";

type Receipt = {
  createdAt?: string;
  referenceNumber: string;
  receiptType: "QUEUE" | "APPOINTMENT";
  ticketNumber?: string;
  appointmentDateIso?: string;
  appointmentTime?: string;
  departmentName?: string;
};

export default function SubmissionReceipt() {
  const nav = useNavigate();
  const location = useLocation();

  // Get the reference number from the URL
  const { referenceNumber: routeReferenceNumber = "" } = useParams();

  const client = useMemo(() => generateClient<Schema>(), []);

  const referenceNumber = routeReferenceNumber.trim().toUpperCase();

  // Check if the receipt was passed through location state (from the submission page)
  const routeReceipt = useMemo(() => {
    const state = location.state as { receipt?: Receipt } | null;
    const candidate = state?.receipt;

    if (!candidate?.referenceNumber) {
      return null;
    }

    if (candidate.receiptType !== "QUEUE" && candidate.receiptType !== "APPOINTMENT") {
      return null;
    }

    const candidateReferenceNumber = candidate.referenceNumber.trim().toUpperCase();

    if (candidateReferenceNumber !== referenceNumber) {
      return null;
    }

    return {
      ...candidate,
      referenceNumber: candidateReferenceNumber,
    };
  }, [location.state, referenceNumber]);

  const [receipt, setReceipt] = useState<Receipt | null>(routeReceipt);
  const [loading, setLoading] = useState(!routeReceipt);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const isAppointment = receipt?.receiptType === "APPOINTMENT";

  useEffect(() => {
    setReceipt(routeReceipt);
    setLoading(!routeReceipt);
    setErrorMessage(null);
  }, [routeReceipt]);

  let submittedAt = "";

  if (receipt?.createdAt) {
    const value = dayjs(receipt.createdAt);

    if (value.isValid()) {
      submittedAt = value.format("D MMMM YYYY, h:mm A");
    }
  }

  let appointmentDate = "";

  if (receipt?.appointmentDateIso) {
    const value = dayjs(receipt.appointmentDateIso);

    if (value.isValid()) {
      appointmentDate = value.format("D MMMM YYYY");
    } else {
      appointmentDate = receipt.appointmentDateIso;
    }
  }

  let qrPayload = "";

  if (receipt) {
    const parts = [`type=${receipt.receiptType}`, `ref=${receipt.referenceNumber}`];

    if (receipt.ticketNumber) {
      parts.push(`ticket=${receipt.ticketNumber}`);
    }

    if (receipt.appointmentDateIso) {
      parts.push(`date=${receipt.appointmentDateIso}`);
    }

    if (receipt.appointmentTime) {
      parts.push(`time=${receipt.appointmentTime}`);
    }

    qrPayload = parts.join("|");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadReceipt() {
      if (!referenceNumber) {
        setReceipt(null);
        setErrorMessage("No case reference was provided.");
        setLoading(false);
        return;
      }

      if (!routeReceipt) {
        setLoading(true);
      }

      setErrorMessage(null);

      try {
        const authMode = await getDataAuthMode();
        const response = await client.queries.getSubmissionReceipt(
          { referenceNumber },
          { authMode },
        );

        if (cancelled) {
          return;
        }

        if (response.errors?.length) {
          console.error("getSubmissionReceipt returned errors", response.errors);

          if (!routeReceipt) {
            const firstMessage = response.errors[0]?.message;

            if (typeof firstMessage === "string" && firstMessage.trim()) {
              if (firstMessage.toLowerCase().includes("unauthorized")) {
                setErrorMessage("You do not have permission to view that receipt right now.");
              } else {
                setErrorMessage(firstMessage);
              }
            } else {
              setErrorMessage("We could not load that receipt right now.");
            }

            setReceipt(null);
          }

          setLoading(false);
          return;
        }

        const data = response.data;
        const receiptType =
          data?.receiptType === "QUEUE" || data?.receiptType === "APPOINTMENT"
            ? data.receiptType
            : null;

        if (!data?.found || !data.referenceNumber || !receiptType) {
          if (!routeReceipt) {
            setReceipt(null);
            setErrorMessage(
              data?.errorMessage || "We could not find a receipt for that case reference.",
            );
          }

          setLoading(false);
          return;
        }

        setReceipt({
          createdAt: data.createdAt || undefined,
          referenceNumber: data.referenceNumber,
          receiptType,
          ticketNumber: data.ticketNumber || undefined,
          appointmentDateIso: data.appointmentDateIso || undefined,
          appointmentTime: data.appointmentTime || undefined,
          departmentName: data.departmentName || undefined,
        });

        setLoading(false);
      } catch (error) {
        console.error("Failed to load receipt", error);

        if (cancelled) {
          return;
        }

        if (!routeReceipt) {
          setReceipt(null);
          setErrorMessage("We could not load that receipt right now.");
        }

        setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      cancelled = true;
    };
  }, [referenceNumber, client, routeReceipt]);

  useEffect(() => {
    let cancelled = false;

    async function buildQrCode() {
      if (!qrPayload) {
        setQrCodeUrl(null);
        return;
      }

      try {
        // Generate the QR code
        const dataUrl = await QRCode.toDataURL(qrPayload, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 280,
        });

        if (!cancelled) {
          setQrCodeUrl(dataUrl);
        }
      } catch (error) {
        console.error("Failed to generate QR code", error);

        if (!cancelled) {
          setQrCodeUrl(null);
        }
      }
    }

    buildQrCode();

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  // Copy a value to the clipboard
  async function copyValue(label: string, value?: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(`${label} copied`);
    } catch (error) {
      console.error("Copy failed", error);
      setCopyMessage("Could not copy. Please write it down.");
    }
  }

  let ttsText = "Submission receipt.";

  if (receipt) {
    if (receipt.receiptType === "APPOINTMENT") {
      const parts = [
        "Your appointment is booked.",
        `Your case reference number is ${receipt.referenceNumber}.`,
      ];

      if (appointmentDate) {
        parts.push(`Your appointment is on ${appointmentDate}.`);
      }

      if (receipt.appointmentTime) {
        parts.push(`at ${receipt.appointmentTime}.`);
      }

      parts.push("Please keep these details safe.");
      ttsText = parts.join(" ");
    } else {
      const parts = [
        "You are in the queue.",
        `Your case reference number is ${receipt.referenceNumber}.`,
      ];

      if (receipt.ticketNumber) {
        parts.push(`Your ticket number is ${receipt.ticketNumber}.`);
      }

      parts.push("Please keep these details safe.");
      ttsText = parts.join(" ");
    }
  }

  const referenceToShow = receipt?.referenceNumber || referenceNumber || undefined;

  let chipLabel = "Receipt";
  let heading = "Submission receipt";
  let introText = "Use your case reference to view this receipt again.";

  if (loading) {
    chipLabel = "Loading receipt";
    heading = "Loading your receipt";
    introText = "Please wait while we load your receipt.";
  } else if (isAppointment) {
    chipLabel = "Appointment confirmed";
    heading = "Your appointment is booked";
    introText = "Keep these details safe. You may need them when you arrive at reception.";
  } else if (receipt) {
    chipLabel = "Queue receipt";
    heading = "Your request has been submitted";
    introText = "Keep these details safe so you can check your queue status later.";
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <NavBar />

      <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
        {/* Receipt details*/}
        <Stack spacing={3}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              bgcolor: "background.paper",
            }}
          >
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "stretch" }}
                spacing={3}
              >
                <Box sx={{ flex: 1 }}>
                  <Chip
                    label={chipLabel}
                    color={isAppointment ? "success" : "primary"}
                    sx={{ mb: 2, fontWeight: 700 }}
                  />

                  <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, lineHeight: 1.1 }}>
                    {heading}
                  </Typography>

                  <Typography color="text.secondary" sx={{ maxWidth: 620 }}>
                    {introText}
                  </Typography>
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    minWidth: { xs: "100%", md: 280 },
                    p: 2.5,
                    borderRadius: 2.5,
                    bgcolor: "background.default",
                  }}
                >
                  {/* Case reference number */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                    Case reference number
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 900, letterSpacing: 1, wordBreak: "break-word", mb: 2 }}
                  >
                    {referenceToShow || "-"}
                  </Typography>

                  {/* Ticket number */}
                  {!isAppointment && receipt?.ticketNumber ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        Ticket number
                      </Typography>

                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        {receipt.ticketNumber}
                      </Typography>
                    </>
                  ) : null}

                  {/* Appointment info */}
                  {isAppointment && receipt?.appointmentTime ? (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        Appointment time
                      </Typography>

                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                        {receipt.appointmentTime}
                      </Typography>
                    </>
                  ) : null}

                  {/* Copy/print buttons */}
                  <Stack spacing={1.25}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => copyValue("Case reference number", referenceToShow)}
                      disabled={!referenceToShow}
                    >
                      Copy reference number
                    </Button>

                    <Button type="button" variant="contained" onClick={() => window.print()}>
                      Print or save
                    </Button>
                  </Stack>
                </Paper>
              </Stack>

              <Alert severity="info" variant="outlined">
                Write down or save your case reference number now.
                {!isAppointment && receipt?.ticketNumber ? " Keep your ticket number as well." : ""}
              </Alert>
            </Stack>
          </Paper>

          {/* Loading/errors */}
          {loading ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography fontWeight={700}>Loading your receipt...</Typography>
            </Paper>
          ) : null}

          {!loading && errorMessage ? (
            <Alert severity="warning" variant="outlined">
              {errorMessage}
            </Alert>
          ) : null}

          {/* Main receipt body */}
          {receipt ? (
            <WithTTS copy={{ label: "Submission receipt", tts: ttsText }} titleVariant="h6">
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Paper variant="outlined" sx={{ flex: 1, p: 3, borderRadius: 3 }}>
                    <Stack spacing={3}>
                      {!isAppointment ? (
                        <>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                              Ticket number
                            </Typography>
                            <Typography variant="h2" sx={{ fontWeight: 900, lineHeight: 1 }}>
                              {receipt.ticketNumber || "-"}
                            </Typography>
                          </Box>

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                            <Button
                              type="button"
                              variant="outlined"
                              onClick={() => copyValue("Ticket number", receipt.ticketNumber)}
                              disabled={!receipt.ticketNumber}
                            >
                              Copy ticket number
                            </Button>

                            <Button
                              type="button"
                              variant="contained"
                              onClick={() => nav("/referencepage")}
                              disabled={!receipt.ticketNumber}
                            >
                              Check queue status
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        <Stack spacing={2.5}>
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                              Appointment date
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                              {appointmentDate || "Not available"}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                              Appointment time
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                              {receipt.appointmentTime || "Not available"}
                            </Typography>
                          </Box>

                          <Button
                            type="button"
                            variant="outlined"
                            onClick={() =>
                              copyValue(
                                "Appointment details",
                                [appointmentDate, receipt.appointmentTime]
                                  .filter(Boolean)
                                  .join(" "),
                              )
                            }
                          >
                            Copy appointment details
                          </Button>
                        </Stack>
                      )}

                      {receipt.departmentName || submittedAt ? <Divider /> : null}

                      {/* Department name and submission info */}
                      <Stack spacing={1.5}>
                        {receipt.departmentName ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Department
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              {receipt.departmentName}
                            </Typography>
                          </Box>
                        ) : null}

                        {submittedAt ? (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Submitted
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>{submittedAt}</Typography>
                          </Box>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>

                  <Paper
                    variant="outlined"
                    sx={{
                      width: { xs: "100%", md: 320 },
                      p: 3,
                      borderRadius: 3,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    {/* QR code */}
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      Receipt QR code
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2.5 }}>
                      {isAppointment
                        ? "Show this at reception if you are asked to check in."
                        : "Keep this with your case reference and ticket details."}
                    </Typography>

                    {qrCodeUrl ? (
                      <Box
                        component="img"
                        src={qrCodeUrl}
                        alt="Receipt QR code"
                        sx={{ width: 220, height: 220, display: "block", mb: 2 }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 220,
                          height: 220,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 2,
                          bgcolor: "background.default",
                        }}
                      >
                        <Typography color="text.secondary">QR unavailable</Typography>
                      </Box>
                    )}

                    <Typography variant="body2" color="text.secondary">
                      You can still use your case reference if the QR code is not available.
                    </Typography>
                  </Paper>
                </Stack>

                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      What to keep
                    </Typography>
                    <Typography color="text.secondary">
                      Make sure you keep your case reference number.
                      {!isAppointment && receipt.ticketNumber
                        ? " Keep your ticket number as well."
                        : ""}
                    </Typography>
                    <Typography color="text.secondary">
                      {isAppointment
                        ? "When you arrive at reception, have your case reference number or QR code ready."
                        : "Use the queue page and your ticket number or QR code to check position and wait time."}
                    </Typography>
                  </Stack>
                </Paper>
              </Stack>
            </WithTTS>
          ) : null}
        </Stack>
      </Container>

      <Snackbar
        open={!!copyMessage}
        autoHideDuration={2200}
        onClose={() => setCopyMessage(null)}
        message={copyMessage || ""}
      />
    </Box>
  );
}

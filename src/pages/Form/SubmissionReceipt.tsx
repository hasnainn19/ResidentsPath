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
import { Alert, Box, Container, Paper, Snackbar, Stack, Typography } from "@mui/material";

import type { Schema } from "../../../amplify/data/resource";
import NavBar from "../../components/NavBar";
import ReceiptBody from "../../components/SubmissionReceiptComponents/ReceiptBody";
import ReceiptHeaderCard from "../../components/SubmissionReceiptComponents/ReceiptHeaderCard";
import { getDataAuthMode } from "../../utils/getDataAuthMode";

type Receipt = {
  createdAt?: string;
  referenceNumber: string;
  bookingReferenceNumber?: string;
  receiptType: "QUEUE" | "APPOINTMENT";
  ticketNumber?: string;
  appointmentDateIso?: string;
  appointmentTime?: string;
  departmentName?: string;
};

export default function SubmissionReceipt() {
  const nav = useNavigate();
  const location = useLocation();

  // Get the case reference number from the URL
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
      bookingReferenceNumber: candidate.bookingReferenceNumber?.trim().toUpperCase(),
    };
  }, [location.state, referenceNumber]);

  const [receipt, setReceipt] = useState<Receipt | null>(routeReceipt);
  const [loading, setLoading] = useState(!routeReceipt);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const isAppointment = receipt?.receiptType === "APPOINTMENT";

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
    if (receipt.receiptType === "APPOINTMENT") {
      qrPayload = receipt.bookingReferenceNumber
        ? ["APPOINTMENT", receipt.bookingReferenceNumber].join("|")
        : "";
    } else {
      qrPayload = receipt.ticketNumber ? ["QUEUE", receipt.ticketNumber].join("|") : "";
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadReceipt() {
      setReceipt(routeReceipt);
      setLoading(!routeReceipt);
      setErrorMessage(null);

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
          bookingReferenceNumber: data.bookingReferenceNumber || undefined,
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

      if (receipt.bookingReferenceNumber) {
        parts.push(`Your appointment reference number is ${receipt.bookingReferenceNumber}.`);
      }

      if (appointmentDate) {
        parts.push(`Your appointment is on ${appointmentDate}.`);
      }

      if (receipt.appointmentTime) {
        parts.push(`at ${receipt.appointmentTime}.`);
      }

      parts.push(
        "To check in on the day of your appointment, go to the reference page at Hounslow House and enter your appointment reference number or scan this QR code.",
      );
      parts.push(
        "If you need to cancel your appointment, go to the reference page and enter your appointment reference number or scan this QR code.",
      );
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

  const receiptHeading = isAppointment
    ? "Appointment receipt"
    : receipt?.ticketNumber
      ? "Ticket receipt"
      : "Queue receipt";

  let chipLabel = "Receipt";
  let heading = "Receipt details";
  let introText = "Use your case reference to view this receipt again.";

  if (loading) {
    chipLabel = "Loading receipt";
    heading = "Loading your receipt";
    introText = "Please wait while we load your receipt.";
  } else if (isAppointment) {
    chipLabel = "Appointment confirmed";
    heading = receiptHeading;
    introText = "Keep these details safe. You may need them when you arrive at reception.";
  } else if (receipt) {
    chipLabel = "Queue receipt";
    heading = receiptHeading;
    introText = "Keep these details safe so you can check your queue status later.";
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <NavBar />

      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3, md: 5 } }}>
        {/* Receipt details*/}
        <Stack spacing={{ xs: 2.5, md: 3 }}>
          <ReceiptHeaderCard
            chipLabel={chipLabel}
            heading={heading}
            introText={introText}
            isAppointment={isAppointment}
            caseReferenceNumber={receipt?.referenceNumber}
            appointmentReferenceNumber={receipt?.bookingReferenceNumber}
            ticketNumber={receipt?.ticketNumber}
            appointmentTime={receipt?.appointmentTime}
            onCopyCaseReference={() => copyValue("Case reference number", receipt?.referenceNumber)}
            onCopyAppointmentReference={() =>
              copyValue("Appointment reference number", receipt?.bookingReferenceNumber)
            }
            onPrint={() => window.print()}
          />

          {/* Loading/errors */}
          {loading ? (
            <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
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
            <ReceiptBody
              receipt={receipt}
              isAppointment={isAppointment}
              appointmentDate={appointmentDate}
              submittedAt={submittedAt}
              qrCodeUrl={qrCodeUrl}
              ttsText={ttsText}
              onCopyTicket={() => copyValue("Ticket number", receipt.ticketNumber)}
              onCheckQueueStatus={() => nav("/referencepage")}
              onCopyAppointmentDetails={() =>
                copyValue(
                  "Appointment details",
                  [appointmentDate, receipt.appointmentTime, receipt.bookingReferenceNumber]
                    .filter(Boolean)
                    .join(" "),
                )
              }
            />
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

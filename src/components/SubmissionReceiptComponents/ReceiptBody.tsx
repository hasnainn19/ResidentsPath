import { Paper, Stack, Typography } from "@mui/material";

import WithTTS from "../FormPageComponents/WithTTS";
import ReceiptDetailsCard from "./ReceiptDetailsCard";
import ReceiptQrCard from "./ReceiptQrCard";
import type { ReceiptDetailsCardProps } from "./ReceiptDetailsCard";

type ReceiptBodyProps = ReceiptDetailsCardProps & {
  qrCodeUrl: string | null;
  ttsText: string;
};

export default function ReceiptBody({
  receipt,
  isAppointment,
  appointmentDate,
  submittedAt,
  qrCodeUrl,
  ttsText,
  onCopyTicket,
  onCheckQueueStatus,
  onCopyAppointmentDetails,
}: ReceiptBodyProps) {
  return (
    <WithTTS copy={{ label: "Submission receipt", tts: ttsText }} titleVariant="h6">
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 3 }}>
          <ReceiptDetailsCard
            receipt={receipt}
            isAppointment={isAppointment}
            appointmentDate={appointmentDate}
            submittedAt={submittedAt}
            onCopyTicket={onCopyTicket}
            onCheckQueueStatus={onCheckQueueStatus}
            onCopyAppointmentDetails={onCopyAppointmentDetails}
          />

          <ReceiptQrCard isAppointment={isAppointment} qrCodeUrl={qrCodeUrl} />
        </Stack>

        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              What to keep
            </Typography>
            <Typography color="text.secondary">
              {isAppointment
                ? "Make sure you keep your appointment reference number and case reference number."
                : `Make sure you keep your case reference number${
                    receipt.ticketNumber ? " and ticket number." : "."
                  }`}
            </Typography>
            <Typography color="text.secondary">
              {isAppointment
                ? "When you arrive, have your appointment reference number or QR code ready."
                : "Use your ticket number or QR code on the reference page to check your position and wait time."}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </WithTTS>
  );
}

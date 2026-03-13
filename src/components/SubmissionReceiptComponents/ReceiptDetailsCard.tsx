import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";

type ReceiptSummary = {
  ticketNumber?: string;
  appointmentTime?: string;
  departmentName?: string;
};

export type ReceiptDetailsCardProps = {
  receipt: ReceiptSummary;
  isAppointment: boolean;
  appointmentDate: string;
  submittedAt: string;
  onCopyTicket: () => void;
  onCheckQueueStatus: () => void;
  onCopyAppointmentDetails: () => void;
};

export default function ReceiptDetailsCard({
  receipt,
  isAppointment,
  appointmentDate,
  submittedAt,
  onCopyTicket,
  onCheckQueueStatus,
  onCopyAppointmentDetails,
}: ReceiptDetailsCardProps) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, p: { xs: 2.5, sm: 3 }, borderRadius: 3 }}>
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        {!isAppointment ? (
          <>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Ticket number
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  lineHeight: 1,
                  fontSize: { xs: "3rem", sm: "3.75rem" },
                  overflowWrap: "anywhere",
                }}
              >
                {receipt.ticketNumber || "-"}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <Button
                type="button"
                variant="outlined"
                onClick={onCopyTicket}
                disabled={!receipt.ticketNumber}
                fullWidth
              >
                Copy ticket number
              </Button>

              <Button
                type="button"
                variant="contained"
                onClick={onCheckQueueStatus}
                disabled={!receipt.ticketNumber}
                fullWidth
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
              <Typography variant="h5" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                {appointmentDate || "Not available"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Appointment time
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, overflowWrap: "anywhere" }}>
                {receipt.appointmentTime || "Not available"}
              </Typography>
            </Box>

            <Button type="button" variant="outlined" onClick={onCopyAppointmentDetails} fullWidth>
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
              <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>
                {receipt.departmentName}
              </Typography>
            </Box>
          ) : null}

          {submittedAt ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Submitted
              </Typography>
              <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{submittedAt}</Typography>
            </Box>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
}

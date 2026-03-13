import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type ReceiptHeaderCardProps = {
  chipLabel: string;
  heading: string;
  introText: string;
  isAppointment: boolean;
  referenceToShow?: string;
  ticketNumber?: string;
  appointmentTime?: string;
  onCopyReference: () => void;
  onPrint: () => void;
};

export default function ReceiptHeaderCard({
  chipLabel,
  heading,
  introText,
  isAppointment,
  referenceToShow,
  ticketNumber,
  appointmentTime,
  onCopyReference,
  onPrint,
}: ReceiptHeaderCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 3,
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={{ xs: 2.5, md: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "stretch" }}
          spacing={{ xs: 2, md: 3 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Chip
              label={chipLabel}
              color={isAppointment ? "success" : "primary"}
              sx={{ mb: 2, fontWeight: 700, maxWidth: "100%" }}
            />

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                mb: 1.5,
                lineHeight: 1.1,
                fontSize: { xs: "1.9rem", sm: "2.125rem" },
                overflowWrap: "anywhere",
              }}
            >
              {heading}
            </Typography>

            <Typography color="text.secondary" sx={{ maxWidth: { xs: "100%", md: 620 } }}>
              {introText}
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              width: { xs: "100%", md: 280 },
              minWidth: 0,
              p: { xs: 2, sm: 2.5 },
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
              sx={{
                fontWeight: 900,
                letterSpacing: 1,
                overflowWrap: "anywhere",
                mb: 2,
                fontSize: { xs: "1.35rem", sm: "1.5rem" },
              }}
            >
              {referenceToShow || "-"}
            </Typography>

            {/* Ticket number */}
            {!isAppointment && ticketNumber ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                  Ticket number
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, overflowWrap: "anywhere" }}>
                  {ticketNumber}
                </Typography>
              </>
            ) : null}

            {/* Appointment info */}
            {isAppointment && appointmentTime ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                  Appointment time
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, overflowWrap: "anywhere" }}>
                  {appointmentTime}
                </Typography>
              </>
            ) : null}

            {/* Copy/print buttons */}
            <Stack spacing={1.25}>
              <Button
                type="button"
                variant="outlined"
                onClick={onCopyReference}
                disabled={!referenceToShow}
                fullWidth
              >
                Copy reference number
              </Button>

              <Button type="button" variant="contained" onClick={onPrint} fullWidth>
                Print or save
              </Button>
            </Stack>
          </Paper>
        </Stack>

        <Alert
          severity="info"
          variant="outlined"
          sx={(theme) => ({
            borderRadius: 2,
            py: 1.5,
            borderColor: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            "& .MuiAlert-message": { width: "100%" },
            "& .MuiAlert-icon": { color: "primary.main" },
            color: "primary.main",
          })}
        >
          Write down or save your case reference number
          {!isAppointment && ticketNumber ? " and ticket number now." : " now."}
        </Alert>
      </Stack>
    </Paper>
  );
}

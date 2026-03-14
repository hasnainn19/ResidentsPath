import { Alert, Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type ReceiptHeaderCardProps = {
  chipLabel: string;
  heading: string;
  introText: string;
  isAppointment: boolean;
  caseReferenceNumber?: string;
  appointmentReferenceNumber?: string;
  ticketNumber?: string;
  onCopyCaseReference: () => void;
  onCopyAppointmentReference: () => void;
  onPrint: () => void;
};

export default function ReceiptHeaderCard({
  chipLabel,
  heading,
  introText,
  isAppointment,
  caseReferenceNumber,
  appointmentReferenceNumber,
  ticketNumber,
  onCopyCaseReference,
  onCopyAppointmentReference,
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
            {isAppointment ? (
              <Alert
                severity="info"
                variant="outlined"
                sx={({ palette: { primary, text } }) => ({
                  mt: 2.5,
                  maxWidth: { xs: "100%", md: 620 },
                  alignItems: "flex-start",
                  borderRadius: 3,
                  border: `1px solid ${alpha(primary.main, 0.28)}`,
                  borderLeft: `6px solid ${primary.main}`,
                  bgcolor: alpha(primary.light, 0.32),
                  color: text.primary,
                  boxShadow: `0 10px 24px ${alpha(primary.dark, 0.12)}`,
                  "& .MuiAlert-message": { width: "100%" },
                  "& .MuiAlert-icon": {
                    mt: 0.25,
                    color: primary.main,
                  },
                })}
              >
                <Stack spacing={1.75}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Checking in or cancelling
                    </Typography>
                    <Chip
                      label="Important"
                      size="small"
                      sx={({ palette: { primary } }) => ({
                        fontWeight: 700,
                        bgcolor: alpha(primary.main, 0.12),
                        color: primary.dark,
                        border: `1px solid ${alpha(primary.main, 0.24)}`,
                      })}
                    />
                  </Stack>

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                      Check in on the day
                    </Typography>
                    <Box component="ol" sx={{ m: 0, pl: 2.5 }}>
                      <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                        Go to the reference page at Hounslow House using a kiosk or PC.
                      </Typography>
                      <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                        Enter your appointment reference number or scan the QR code.
                      </Typography>
                      <Typography component="li" variant="body2">
                        You can also show your appointment reference number or QR code to reception.
                      </Typography>
                    </Box>
                  </Box>

                  <Divider flexItem />

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                      Cancel your appointment
                    </Typography>
                    <Typography variant="body2">
                      Go to the reference page on any device, then enter your appointment reference
                      number or scan the QR code.
                    </Typography>
                  </Box>
                </Stack>
              </Alert>
            ) : (
              <Alert
                severity="info"
                variant="outlined"
                sx={({ palette: { primary, text } }) => ({
                  mt: 2.5,
                  maxWidth: { xs: "100%", md: 620 },
                  alignItems: "flex-start",
                  borderRadius: 3,
                  border: `1px solid ${alpha(primary.main, 0.22)}`,
                  borderLeft: `6px solid ${primary.main}`,
                  bgcolor: alpha(primary.light, 0.22),
                  color: text.primary,
                  boxShadow: `0 10px 24px ${alpha(primary.dark, 0.1)}`,
                  "& .MuiAlert-message": { width: "100%" },
                  "& .MuiAlert-icon": {
                    mt: 0.25,
                    color: primary.main,
                  },
                })}
              >
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    While you are waiting
                  </Typography>

                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Keep your ticket number ready while you wait.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      Use your ticket number or QR code on the reference page to check your queue
                      position and estimated wait time.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      After entering your ticket number or scanning the QR code on the reference
                      page, you can choose to step out and receive updates.
                    </Typography>
                    <Typography component="li" variant="body2">
                      When you are called, have your ticket number ready to show to reception or
                      staff.
                    </Typography>
                  </Box>
                </Stack>
              </Alert>
            )}
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
              {caseReferenceNumber || "-"}
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
            {isAppointment && appointmentReferenceNumber ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                  Appointment reference number
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, overflowWrap: "anywhere" }}>
                  {appointmentReferenceNumber}
                </Typography>
              </>
            ) : null}

            {/* Copy/print buttons */}
            <Stack spacing={1.25}>
              {isAppointment ? (
                <Button
                  type="button"
                  variant="outlined"
                  onClick={onCopyAppointmentReference}
                  disabled={!appointmentReferenceNumber}
                  fullWidth
                >
                  Copy appointment reference
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outlined"
                onClick={onCopyCaseReference}
                disabled={!caseReferenceNumber}
                fullWidth
              >
                {isAppointment ? "Copy case reference" : "Copy reference number"}
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
          sx={({ palette: { primary } }) => ({
            borderRadius: 2,
            py: 1.5,
            borderColor: "primary.main",
            bgcolor: alpha(primary.main, 0.08),
            "& .MuiAlert-message": { width: "100%" },
            "& .MuiAlert-icon": { color: "primary.main" },
            color: "primary.main",
          })}
        >
          {isAppointment
            ? "Write down or save your appointment reference number and case reference number now."
            : `Write down or save your case reference number${
                ticketNumber ? " and ticket number now." : " now."
              }`}
        </Alert>
      </Stack>
    </Paper>
  );
}

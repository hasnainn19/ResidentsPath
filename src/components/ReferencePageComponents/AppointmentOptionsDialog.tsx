import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import TextToSpeechButton from "../TextToSpeechButton";

type AppointmentOptionsDialogProps = {
  appointmentReferenceNumber?: string | null;
  canCheckInAppointments: boolean;
  isCheckingIn: boolean;
  isCancelling: boolean;
  onClose: () => void;
  onCancelAppointment: () => void;
  onCheckInAppointment: () => void;
};

export default function AppointmentOptionsDialog({
  appointmentReferenceNumber,
  canCheckInAppointments,
  isCheckingIn,
  isCancelling,
  onClose,
  onCancelAppointment,
  onCheckInAppointment,
}: AppointmentOptionsDialogProps) {
  const {  t: translate } = useTranslation();
  const appointmentDialogTtsText = appointmentReferenceNumber
    ? [
        `Appointment options for reference ${appointmentReferenceNumber}.`,
        `You can ${canCheckInAppointments ? "cancel this appointment or check in." : "cancel this appointment."}`,
        !canCheckInAppointments ? "Check-in is only available at Hounslow House." : "",
        "Use the close button if you do not want to make a change.",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <Dialog
      open={Boolean(appointmentReferenceNumber)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            width: "min(92vw, 760px)", 
            minHeight: 360,
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 4, pt: 4, pb: 1, pr: 8, fontSize: "2.2rem", fontWeight: 700 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 6, flexWrap: "wrap" }}>
          <Box component="span">{translate("appOptions-app")}</Box>
          <TextToSpeechButton text={appointmentDialogTtsText} />
        </Box>
        <IconButton
          aria-label="Close appointment options"
          onClick={onClose}
          disabled={isCheckingIn || isCancelling}
          sx={{ position: "absolute", top: 24, right: 24 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 4, pb: 2 }}>
        <DialogContentText sx={{ fontSize: "1.2rem", lineHeight: 1.5 }}>
          {translate("appOptions-what")} {appointmentReferenceNumber}?
        </DialogContentText>
        {!canCheckInAppointments && (
          <DialogContentText sx={{ mt: 2, fontSize: "1.1rem", lineHeight: 1.5 }}>
            {translate("appOptions-ch")}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 4,
          pb: 4,
          pt: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: canCheckInAppointments ? { xs: "1fr", sm: "1fr 1fr" } : "1fr",
            gap: 1.5,
            width: "100%",
          }}
        >
          <Button
            color="error"
            onClick={onCancelAppointment}
            disabled={isCheckingIn || isCancelling}
            size="large"
            variant="contained"
            sx={{ minHeight: 60, px: 3, fontSize: "1.05rem", width: "100%" }}
          >
            {translate("appOptions-cancel")}
          </Button>
          {canCheckInAppointments && (
            <Button
              variant="contained"
              onClick={onCheckInAppointment}
              disabled={isCheckingIn || isCancelling}
              size="large"
              sx={{ minHeight: 60, px: 3, fontSize: "1.05rem", width: "100%" }}
            >
              {translate("landing-check")}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

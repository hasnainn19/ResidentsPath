import { Box, Typography } from "@mui/material";

type ReceiptQrCardProps = {
  isAppointment: boolean;
  qrCodeUrl: string | null;
};

export default function ReceiptQrCard({ isAppointment, qrCodeUrl }: ReceiptQrCardProps) {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: 320 },
        p: { xs: 2.5, sm: 3 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        borderTop: { xs: 2, md: 0 },
        borderLeft: { xs: 0, md: 2 },
        borderColor: "grey.300",
      }}
    >
      {/* QR code */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
        Receipt QR code
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 2.5 }}>
        {isAppointment
          ? "Scan this at a kiosk or reception when you arrive for a quick check-in."
          : "Keep this with your case reference and ticket details for a quick check-in."}
      </Typography>

      {qrCodeUrl ? (
        <Box
          component="img"
          src={qrCodeUrl}
          alt="Receipt QR code"
          sx={{
            width: "100%",
            maxWidth: 220,
            height: "auto",
            aspectRatio: "1 / 1",
            display: "block",
            mb: 2,
          }}
        />
      ) : (
        <Box
          sx={{
            width: "100%",
            maxWidth: 220,
            aspectRatio: "1 / 1",
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
        You can still use your {isAppointment ? "appointment reference" : "ticket"} number if the QR
        code is not available.
      </Typography>
    </Box>
  );
}

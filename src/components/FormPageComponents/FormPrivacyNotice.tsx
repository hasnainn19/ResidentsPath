import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { outlinedInfoAlertSx } from "./outlinedInfoAlertSx";
import PrivacyNoticeDialog from "./PrivacyNoticeDialog";

export default function FormPrivacyNotice() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Paper
        variant="outlined"
        sx={(theme) => ({
          p: { xs: 2.5, sm: 3 },
          borderRadius: { xs: 1.5, sm: 2 },
          borderColor: theme.palette.primary.main,
          background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.24)} 0%, ${theme.palette.background.paper} 55%)`,
        })}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="primary.dark" sx={{ mb: 0.75 }}>
              Privacy notice
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This notice explains how your personal information is collected, used, shared and
              kept by the Council when you use ResidentsPath.
            </Typography>
          </Box>

          <Alert
            severity="info"
            variant="outlined"
            sx={outlinedInfoAlertSx}
          >
            The London Borough of Hounslow is committed to protecting and respecting your privacy
            and meeting its obligation under data protection law and other relevant legislation.
          </Alert>

          <Box component="ul" sx={{ m: 0, pl: 3, display: "grid", gap: 0.75 }}>
            <Box component="li">
              <Typography variant="body2">
                We use the information you provide to direct your enquiry to the right service and
                understand any support or safeguarding needs linked to your request.
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">
                If you choose to provide contact details, we use them to manage your request and
                send the updates you have asked for.
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">
                If you use Save and continue later, a draft may be stored locally in this browser
                on this device until you return to the form, start a new form, or clear your
                browser storage.
              </Typography>
            </Box>
            <Box component="li">
              <Typography variant="body2">
                Do not use Save and continue later on a public or shared device unless you are
                happy for someone else using that device to be able to access your draft.
              </Typography>
            </Box>
          </Box>

          <Button
            type="button"
            variant="text"
            onClick={() => setDialogOpen(true)}
            sx={{ alignSelf: "flex-start", px: 0, fontWeight: 700, color: "primary.dark" }}
          >
            Read the full privacy notice
          </Button>
        </Stack>
      </Paper>

      <PrivacyNoticeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

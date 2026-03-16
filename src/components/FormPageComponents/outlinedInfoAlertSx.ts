import { alpha, type Theme } from "@mui/material/styles";

export const outlinedInfoAlertSx = (theme: Theme) => ({
  borderRadius: 2,
  border: "2px solid",
  borderColor: theme.palette.primary.main,
  borderLeftWidth: 8,
  bgcolor: alpha(theme.palette.primary.main, 0.08),
  "& .MuiAlert-icon": {
    color: theme.palette.primary.dark,
  },
});

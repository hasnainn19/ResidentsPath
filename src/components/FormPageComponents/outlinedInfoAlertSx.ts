import { alpha, type Theme } from "@mui/material/styles";

export const outlinedInfoAlertSx = ({ palette }: Theme) => ({
  borderRadius: 2,
  border: "2px solid",
  borderColor: palette.primary.main,
  borderLeftWidth: 8,
  bgcolor: alpha(palette.primary.main, 0.08),
  "& .MuiAlert-icon": {
    color: palette.primary.dark,
  },
});

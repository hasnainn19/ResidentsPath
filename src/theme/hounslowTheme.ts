import { createTheme } from "@mui/material/styles";

export const hounslowTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#652F6C",      
      light: "#E0D4FD",     
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#E0D4FD",
      contrastText: "#1B1020",
    },
    background: {
      default: "#F6F3FB",
      paper: "#FFFFFF",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif',
    h5: { fontWeight: 800 },
    subtitle1: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", borderRadius: 12 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderColor: "rgba(0,0,0,0.12)" },
      },
    },
  },
});

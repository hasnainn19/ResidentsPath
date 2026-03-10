import { createTheme } from "@mui/material/styles";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6d3874",
      light: "#e0d4fd",
      dark: "#652f6c",
    },
    secondary: {
      main: "#e0d4fd",
      light: "#ECE2FE",
    },
    error: {
      main: "#d32f2f",
    },
    success: {
      main: "#defbd3",
      dark: "#9df07d",
    },
    warning: {
      main: "#fdfde9",
    },
    background: {
      default: "#f7f7f7",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@media (max-width:900px)": {
          body: {
            paddingRight: "0 !important",
          },
          ".mui-fixed": {
            paddingRight: "0 !important",
          },
        },
      },
    },
  },
});

export default theme;

import { Box, CircularProgress } from "@mui/material";

interface LoadingSpinnerProps {
  size?: number;
}

/**
 * Loading spinner component displayed while authentication or data is being fetched.
 * Centers a circular progress indicator on the screen.
 *
 * @param size - Optional size of the spinner in pixels (default: 40)
 */
export default function LoadingSpinner({ size = 40 }: LoadingSpinnerProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
}

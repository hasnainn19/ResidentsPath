import { Box, Typography, Button, Container } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BlockIcon from "@mui/icons-material/Block";

/**
 * Access Denied page shown when a user tries to access a route they don't have permission for.
 * Displays a simple error message with a button to navigate back to the previous page.
 */
export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: "20vh",
          minHeight: "100vh",
          textAlign: "center",
          gap: 3,
        }}
      >
        <BlockIcon sx={{ fontSize: 80, color: "error.main" }} />

        <Typography variant="h3" fontWeight="bold">
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary">
          You don't have permission to access this page.
        </Typography>

        <Button variant="contained" size="large" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Box>
    </Container>
  );
}
import Navbar from "../components/NavBar";
import TextToSpeechButton from "../components/TextToSpeechButton";
import { Alert, AlertTitle, Container, Box } from '@mui/material';


const CheckInConfirmationPage = () => {
  return (
    <>
        <Navbar />
        <Container
            maxWidth="sm"
            sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh", // centers vertically
            // textAlign: "center",
            }}
        >
            <Box>
                <Alert
                    severity="success"
                    variant="outlined"
                    sx={{
                    borderColor: "primary.main",  // purple border
                    bgcolor: "secondary.light",     // light purple background
                    color: "primary.dark",        // darker purple text
                    borderRadius: 3,
                    py: 4,                        // larger padding
                    px: 6,
                    fontSize: "1.5rem",           // large text
                    width: "100%",
                    "& .MuiAlert-title": { fontSize: "2rem", fontWeight: 700 },
                    "& .MuiAlert-icon": {  color: "primary.main"  },
                    }}
                >
                  <AlertTitle>Check in confirmed</AlertTitle>
                    You have successfully booked in!
              </Alert>
              </Box>
        </Container>
    </>
  );
};

export default CheckInConfirmationPage;
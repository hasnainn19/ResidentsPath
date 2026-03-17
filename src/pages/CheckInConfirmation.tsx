import { Alert, AlertTitle, Container, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Navbar from "../components/NavBar";
import TextToSpeechButton from "../components/TextToSpeechButton";

const CheckInConfirmationPage = () => {
  const {  t: translate } = useTranslation();

  return (
    <>
        <Navbar />
        <Container
            maxWidth="sm"
            sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
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
                        py: 4,                 
                        px: 6,
                        fontSize: "1.5rem",         
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        "& .MuiAlert-title": {  fontWeight: 700 },
                        "& .MuiAlert-icon": {  color: "primary.main", fontSize: "2rem"  },
                    }}
                >
                    <AlertTitle>{translate("CheckIn-ch")}</AlertTitle>
                        {translate("CheckIn-you")}
                    <Box  sx={{ mt: 2 }}>
                        <TextToSpeechButton text='Check in Confirmed. You have successfully checked in for your appointment!'/>
                    </Box>
                </Alert>
            </Box> 
        </Container>
        
    </>
  );
};

export default CheckInConfirmationPage;
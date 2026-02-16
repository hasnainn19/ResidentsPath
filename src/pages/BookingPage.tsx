import Navbar from "../components/NavBar";
import BookingPanel from "../components/BookingPanel";
import { Container, Typography } from "@mui/material";
import TextToSpeechButton from "../components/TextToSpeechButton";

const BookingPage = () => {
  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography align="center" variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 5 }}>
            Book your appointment here 
            <TextToSpeechButton text='Book your appointment here'/>
        </Typography>
        <BookingPanel />
      </Container>
    </>
  );
};

export default BookingPage;

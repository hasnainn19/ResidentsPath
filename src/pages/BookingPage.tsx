import { Container, Typography } from "@mui/material";
import { useTranslation } from 'react-i18next';
import TextToSpeechButton from "../components/TextToSpeechButton";
import Navbar from "../components/NavBar";
import BookingPanel from "../components/BookingPanel";

const BookingPage = () => {
  const {  t: translate } = useTranslation();

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography align="center" variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 5 }}>
            {translate("booking-book")} 
            <TextToSpeechButton text='Book your appointment here'/>
        </Typography>
        <BookingPanel />
      </Container>
    </>
  );
};

export default BookingPage;

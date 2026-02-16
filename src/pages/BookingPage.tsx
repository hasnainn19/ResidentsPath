import Navbar from "../components/NavBar";
import BookingPanel from "../components/BookingPanel";
import { Container } from "@mui/material";

const BookingPage = () => {
  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <BookingPanel />
      </Container>
    </>
  );
};

export default BookingPage;

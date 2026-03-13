import { Box, Button, Modal, Typography, styled } from "@mui/material";

interface ConfirmChangeModalProps {
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
}

const ModalContent = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "75%",
  backgroundColor: theme.palette.background.paper,
  border: "2px solid #000",
  boxShadow: theme.shadows[24],
  padding: theme.spacing(4),
  overflow: "scroll",
  scrollbarWidth: "thin",
}));

const ActionsRow = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: "flex",
  gap: theme.spacing(1),
}));

// This component shows a confirmation modal when a staff user attempts to change a case position in the queue.
const ConfirmChangeModal = ({
  open,
  handleClose,
  handleConfirm,
}: ConfirmChangeModalProps) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent>
        <Box>
          <Typography
            id="confirm-change-modal-title"
            variant="h6"
            component="h2"
          >
            Confirm Change
          </Typography>
        </Box>
        <Typography sx={{ mt: 1 }}>Do you want to confirm change?</Typography>
        <ActionsRow>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </ActionsRow>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmChangeModal;

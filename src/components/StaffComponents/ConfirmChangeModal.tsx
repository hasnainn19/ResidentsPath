import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

interface ConfirmChangeModalProps {
  open: boolean;
  handleClose: () => void;
}

const ModalContainer = styled(Box)(({ theme }) => ({
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

const ModalTitle = styled(Typography)({
  marginBottom: 16,
});

const PasswordInput = styled(TextField)({
  width: "100%",
});

const Actions = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
});

const ConfirmButton = styled(Button)({
  marginTop: 16,
});

// This component is a modal that appears when the user attempts to make changes that require confirmation, such as reordering cases in the service queue. It prompts the user to enter their password to confirm the changes.
const ConfirmChangeModal = ({ open, handleClose }: ConfirmChangeModalProps) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContainer>
        <ModalTitle id="confirm-change-modal-title" variant="h6">
          Confirm Change
        </ModalTitle>
        <PasswordInput
          type="password"
          placeholder="Type your password to confirm changes"
        />
        <Actions>
          <ConfirmButton
            variant="contained"
            color="primary"
            onClick={handleClose}
          >
            Confirm
          </ConfirmButton>
        </Actions>
      </ModalContainer>
    </Modal>
  );
};

export default ConfirmChangeModal;

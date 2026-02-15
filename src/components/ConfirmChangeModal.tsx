import { Box, Button, Input, Modal, Typography } from "@mui/material";
import React from "react";

interface ConfirmChangeModalProps {
  open: boolean;
  handleClose: () => void;
}
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "75%",

  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: "scroll",
  scrollbarWidth: "thin",
};
const ConfirmChangeModal = ({ open, handleClose }: ConfirmChangeModalProps) => {
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box>
          <Typography
            id="confirm-change-modal-title"
            variant="h6"
            component="h2"
          >
            Confirm Change
          </Typography>
        </Box>
        <Input placeholder="Type your password to confirm changes" fullWidth />
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={handleClose}
        >
          Confirm
        </Button>
      </Box>
    </Modal>
  );
};

export default ConfirmChangeModal;

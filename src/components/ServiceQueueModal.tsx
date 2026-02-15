// ServiceQueueModal.tsx
import { Box, Modal, Typography } from "@mui/material";
import React, { useState } from "react";
import CaseQueueRow from "./CaseQueueRow";
import { DragDropProvider } from "@dnd-kit/react";
import ConfirmChangeModal from "./ConfirmChangeModal";

interface ServiceQueueModalProps {
  serviceName: string;
  open: boolean;
  handleClose: () => void;
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "75%",
  height: "80%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  overflow: "scroll",
  scrollbarWidth: "thin",
};

const initialServiceCases = [
  {
    id: 1,
    title: "Case 1",
    description: "Description for case 1",
    queuePosition: 1,
    priority: "Urgent" as const,
  },
  {
    id: 2,
    title: "Case 2",
    description:
      "Description for case 2 with more details to show how text wrapping works in the modal layout. This should wrap nicely without breaking the design. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    queuePosition: 2,
    priority: "Priority" as const,
  },
  {
    id: 3,
    title: "Case 3 small title here",
    description: "Description for case 3",
    queuePosition: 3,
    priority: "Standard" as const,
  },
  {
    id: 3,
    title: "Case 3 small title here",
    description: "Description for case 3",
    queuePosition: 3,
    priority: "Standard" as const,
  },
  {
    id: 4,
    title: "Case 4 small title here",
    description: "Description for case 4",
    queuePosition: 4,
    priority: "Standard" as const,
  },
  {
    id: 5,
    title: "Case 5 small title here",
    description: "Description for case 5",
    queuePosition: 5,
    priority: "Standard" as const,
  },
  {
    id: 6,
    title: "Case 6 small title here",
    description: "Description for case 6",
    queuePosition: 6,
    priority: "Standard" as const,
  },
];

// Modal for managing a specific service queue, allowing staff to view and reorder cases based on priority. It integrates the CaseQueueRow component for each case and includes a confirmation modal for changes that require validation.
const ServiceQueueModal = ({
  serviceName,
  open,
  handleClose,
}: ServiceQueueModalProps) => {
  const [serviceCases, setServiceCases] = useState(initialServiceCases);
  const [confirmationModalOpen, setConfirmationModalOpen] =
    React.useState(false);
  const handleConfirmationOpen = () => setConfirmationModalOpen(true);
  const handleConfirmationClose = () => setConfirmationModalOpen(false);

  const handleDragStart = (event: any) => {
    console.log("Drag started:", event);
  };

  const handleDragOver = (event: any) => {
    console.log("Drag over:", event);
  };

  const handleDragEnd = (event: any) => {
    console.log("Drag ended:", event);
    const { active, over } = event;

    console.log("Active:", active, "Over:", over);
    handleConfirmationOpen(); // Incomplete Logic - This will open the confirmation modal, but we need to handle the actual position update after confirmation and password validation.
    if (over && active.id !== over.id) {
      console.log("Updating positions...");
      setServiceCases((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        console.log("Old index:", oldIndex, "New index:", newIndex);

        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);

        const updatedItems = newItems.map((item, index) => ({
          ...item,
          queuePosition: index + 1,
        }));

        console.log("Updated items:", updatedItems);
        return updatedItems;
      });
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {serviceName} Service Queue
          </Typography>
        </Box>
        <DragDropProvider
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <ul className="list" style={{ padding: 0, marginTop: 16 }}>
            {serviceCases.map((c) => (
              <CaseQueueRow key={c.id} {...c} />
            ))}
          </ul>
        </DragDropProvider>
        <ConfirmChangeModal
          open={confirmationModalOpen}
          handleClose={handleConfirmationClose}
        />
      </Box>
    </Modal>
  );
};

export default ServiceQueueModal;

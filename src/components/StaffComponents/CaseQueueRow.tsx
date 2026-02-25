// CaseQueueRow.tsx
import { Box, Chip, Typography } from "@mui/material";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import { useSortable } from "@dnd-kit/react/sortable";

interface CaseQueueRowProps {
  id: number;
  title: string;
  description: string;
  queuePosition: number;
  priority: "Urgent" | "Priority" | "Standard";
}

// This component represents a single case in the service queue modal, designed to be draggable for reordering.
const CaseQueueRow = ({
  id,
  title,
  description,
  queuePosition,
  priority,
}: CaseQueueRowProps) => {
  const { ref, handleRef, isDragging } = useSortable({
    id,
    index: queuePosition - 1,
  });

  return (
    <li ref={ref} style={{ listStyle: "none" }}>
      <Box
        sx={{
          mt: 2,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 2,
          opacity: isDragging ? 0.5 : 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="subtitle1" fontWeight={500}>
              {title}
            </Typography>
            <Chip
              label={priority}
              size="small"
              color={
                priority === "Urgent"
                  ? "error"
                  : priority === "Priority"
                    ? "warning"
                    : "success"
              }
              sx={{ ml: 1 }}
            />
          </Box>
          <DragHandleIcon
            ref={handleRef}
            sx={{ cursor: "move", color: "#888" }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            height: 40,
            overflow: "hidden",
            textOverflow: "ellipsis",
            mt: 1,
          }}
        >
          {description}
        </Typography>
      </Box>
    </li>
  );
};

export default CaseQueueRow;

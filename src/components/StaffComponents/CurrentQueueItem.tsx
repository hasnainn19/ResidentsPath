import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import { useState } from "react";

interface CurrentQueueItemProps {
  caseItem: {
    id: string;
    service: string;
    title: string;
    description: string;
    status: "Priority" | "Standard";
    position: number;
  };
  totalPositions: number;
  handleSelectPosition: (caseId: string, position: number) => void;
}
const CurrentQueueItem = (props: CurrentQueueItemProps) => {
  const { caseItem, totalPositions, handleSelectPosition } = props;
  const [isFlagged, setIsFlagged] = useState(false);
  const positionOptions = Array.from(
    { length: totalPositions },
    (_, index) => index + 1,
  );
  const statusColorMap: Record<string, "error" | "default"> = {
    Priority: "error",
    Standard: "default",
  };
  return (
    <Card key={caseItem.id} sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} mb={1}>
              <Chip
                label={caseItem.status}
                color={statusColorMap[caseItem.status]}
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                #{caseItem.id}
              </Typography>
            </Stack>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {caseItem.title}
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <Box
              sx={{
                maxHeight: 120,
                overflowY: "scroll",
                scrollbarGutter: "stable",
                pr: 1,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {caseItem.description}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1} alignItems="flex-end">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id={`move-position-label-${caseItem.id}`}>
                Move to position
              </InputLabel>
              <Select
                labelId={`move-position-label-${caseItem.id}`}
                label="Move to position"
                value={String(Math.min(caseItem.position, totalPositions))}
                onChange={(event) =>
                  handleSelectPosition(caseItem.id, Number(event.target.value))
                }
              >
                {positionOptions.map((position) => (
                  <MenuItem key={position} value={String(position)}>
                    {position}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack>
              <Button>Mark as Seen</Button>
              <IconButton onClick={() => setIsFlagged(!isFlagged)}>
                <FlagIcon color={isFlagged ? "error" : "disabled"} />
              </IconButton>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CurrentQueueItem;

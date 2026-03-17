import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
}

const DetailRow = ({ label, value }: Props) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      fontWeight={600}
      textTransform="uppercase"
      letterSpacing={0.5}
    >
      {label}
    </Typography>
    <Typography variant="body2" mt={0.25} sx={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
      {value}
    </Typography>
  </Box>
);

export default DetailRow;

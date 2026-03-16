import { Card, CardContent, Divider, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
}
const SectionCard = ({ title, children }: Props) => (
  <Card sx={{ borderRadius: 3 }}>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

export default SectionCard;

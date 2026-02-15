import React from "react";
import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface StatCardProps {
  icon: SvgIconComponent;
  value: string | number;
  label: string;
  change: string;
  isPositive: boolean;
  lastUpdated?: string;
}
const StatCard = ({
  icon: Icon,
  value,
  label,
  change,
  isPositive,
  lastUpdated,
}: StatCardProps) => {
  return (
    <Card sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Avatar sx={{ bgcolor: "#5E35B1", width: 48, height: 48 }}>
            <Icon />
          </Avatar>
          {/* <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: isPositive ? "#388E3C" : "#D32F2F" }}
          >
            {change}
          </Typography> */}
        </Box>

        <Typography variant="h4" fontWeight={600} sx={{ mb: 0.5 }}>
          {value}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Last updated: {lastUpdated ? lastUpdated : "--:--"}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default StatCard;

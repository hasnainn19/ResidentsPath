import { Avatar, Box, Card, CardContent, Typography } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

interface StatCardProps {
  icon: SvgIconComponent;
  value: string | number;
  label: string;
  change: number;
  isPositive: boolean;
  lastUpdated?: string;
}
// This component represents a single statistic card on the staff dashboard, displaying an icon, a key metric value, a label, and the change from the previous period. It also shows the last updated time for the data. The card is styled to visually indicate whether the change is positive or negative.
const StatCard = ({
  icon: Icon,
  value,
  label,
  change,
  isPositive,
  lastUpdated,
}: StatCardProps) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        height: "100%",
        backgroundColor: "background.paper",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              width: 48,
              height: 48,
            }}
          >
            <Icon />
          </Avatar>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                color: (theme) => (isPositive ? "success.dark" : "error.main"),
              }}
            >
              {change > 0 ? "+" : ""}
              {change}%
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              last 1hr
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="h4"
          fontWeight={600}
          sx={{ mb: 0.5, color: "text.primary" }}
        >
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

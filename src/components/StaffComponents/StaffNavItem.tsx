import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

interface StaffNavItemProps {
  icon: ReactNode;
  label: string;
  url: string;
}
// This component represents a single navigation item in the staff sidebar, combining an icon and label with a link to the corresponding page. It is designed to be reusable for different sections of the staff dashboard.
const StaffNavItem = ({ icon, label, url }: StaffNavItemProps) => {
  const navigate = useNavigate();
  return (
    <ListItemButton
      sx={{
        mx: 1,
        borderRadius: 2,
        "&:hover": {
          backgroundColor: "primary.light",
        },
      }}
    >
      <ListItemIcon sx={{ color: "primary.contrastText" }}>{icon}</ListItemIcon>

      <ListItemText
        style={{ textDecoration: "none", color: "inherit" }}
        primary={label}
        onClick={() => navigate(url)}
      />
    </ListItemButton>
  );
};

export default StaffNavItem;

import ListItemIcon from "@mui/material/ListItemIcon";

import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Link } from "react-router-dom";

interface StaffNavItemProps {
  icon: React.ReactNode;
  label: string;
  url: string;
}
const StaffNavItem = ({ icon, label, url }: StaffNavItemProps) => {
  return (
    <ListItemButton
      sx={{
        mx: 1,
        borderRadius: 2,
        "&:hover": {
          backgroundColor: "#5C2D91",
        },
      }}
    >
      <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
      <Link to={url} style={{ textDecoration: "none", color: "inherit" }}>
        <ListItemText primary={label} />
      </Link>
    </ListItemButton>
  );
};

export default StaffNavItem;

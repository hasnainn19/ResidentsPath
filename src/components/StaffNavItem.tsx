import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Link } from "react-router-dom";

interface StaffNavItemProps {
  icon: React.ReactNode;
  label: string;
  url: string;
}
// This component represents a single navigation item in the staff sidebar, combining an icon and label with a link to the corresponding page. It is designed to be reusable for different sections of the staff dashboard.
const StaffNavItem = ({ icon, label, url }: StaffNavItemProps) => {
  return (
    <ListItemButton
      sx={{
        mx: 1,
        borderRadius: 2,
        "&:hover": {
          backgroundColor: (theme) => theme.palette.primary.light,
        },
      }}
    >
      <ListItemIcon
        sx={{ color: (theme) => theme.palette.primary.contrastText }}
      >
        {icon}
      </ListItemIcon>
      <Link to={url} style={{ textDecoration: "none", color: "inherit" }}>
        <ListItemText primary={label} />
      </Link>
    </ListItemButton>
  );
};

export default StaffNavItem;

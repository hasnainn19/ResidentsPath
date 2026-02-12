import ListItemIcon from "@mui/material/ListItemIcon";

import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";

interface StaffNavItemProps {
  icon: React.ReactNode;
  label: string;
}
const StaffNavItem = ({ icon, label }: StaffNavItemProps) => {
  return (
    <ListItemButton
      sx={{
        mx: 1,
        borderRadius: 2,
        "&:hover": {
          backgroundColor: "#7E57C2",
        },
      }}
    >
      <ListItemIcon sx={{ color: "white" }}>{icon}</ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
};

export default StaffNavItem;

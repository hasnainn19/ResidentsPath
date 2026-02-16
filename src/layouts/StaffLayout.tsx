import StaffNavbar from "../components/StaffNavbar";
import Box from "@mui/material/Box";
import { Outlet } from "react-router";

// This layout component wraps all staff-related pages, providing a consistent sidebar navigation and layout structure for the staff dashboard. It uses the StaffNavbar component for navigation and renders the specific page content through the Outlet component from react-router.
const StaffLayout = () => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        backgroundColor: (theme) => theme.palette.background.default,
        minHeight: "100vh",
      }}
    >
      <StaffNavbar />
      <Box sx={{ flex: 1 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default StaffLayout;

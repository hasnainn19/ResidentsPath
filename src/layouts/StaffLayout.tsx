import React from "react";
import StaffNavbar from "../components/StaffNavbar";
import Box from "@mui/material/Box";
import { Outlet } from "react-router";

const StaffLayout = () => {
  return (
    <Box sx={{ width: "100%", display: "flex" }}>
      <StaffNavbar />

      <Outlet />
    </Box>
  );
};

export default StaffLayout;

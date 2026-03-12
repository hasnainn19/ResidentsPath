import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LanguageIcon from "@mui/icons-material/Language";

export default function LanguageSupportButton() {
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClick = (event:any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = () => {
        handleClose();
    };

 return (
    <>
        <Button
            color="inherit"
            startIcon={<LanguageIcon />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleClick}
        >
        EN
        </Button>

        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
        >
            <MenuItem onClick={changeLanguage}>English</MenuItem>
            <MenuItem onClick={changeLanguage}>French</MenuItem>
            <MenuItem onClick={changeLanguage}>Spanish</MenuItem>
      </Menu>
    </>
  );
}
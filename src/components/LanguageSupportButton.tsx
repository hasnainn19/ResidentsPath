import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { useTranslation } from 'react-i18next'
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LanguageIcon from "@mui/icons-material/Language";

export default function LanguageSupportButton() {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const { i18n } = useTranslation();

    const handleClick = (event:any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng); 
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
         {i18n.language.toUpperCase()}
        </Button>

        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
        >
            <MenuItem selected={i18n.language === "en"} onClick={() => changeLanguage("en")}>English</MenuItem>
            <MenuItem selected={i18n.language === "pl"} onClick={() => changeLanguage("pl")}>Polish</MenuItem>
            <MenuItem selected={i18n.language === "pa"} onClick={() => changeLanguage("pa")}>Panjabi</MenuItem>
            <MenuItem selected={i18n.language === "cy"} onClick={() => changeLanguage("cy")}>Welsh</MenuItem>
            <MenuItem selected={i18n.language === "fa"} onClick={() => changeLanguage("fa")}>Persian</MenuItem>
        </Menu>
    </>
  );
}
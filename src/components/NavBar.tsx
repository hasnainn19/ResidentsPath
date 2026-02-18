import React from 'react';
import {AppBar, Box, Toolbar, Typography, Button, Menu, MenuItem, Tooltip, Stack} from '@mui/material';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';


export default function NavBar() {
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const  userSettings= ['Account', 'Login/signup', 'Logout'];

  const handleOpenUserMenu = (event:any) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleMenuItemClick = async (setting: string) => {
    handleCloseUserMenu();

    if (setting === 'Logout') {
      await handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } 
    catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            ResidentsPath
          </Typography>
          <Stack direction='row' spacing={2}>
            <Tooltip title="Show queue information">
              <Button color="inherit">Queue</Button>
            </Tooltip>
            <Tooltip title="Create your case">
              <Button color="inherit">Form</Button>
            </Tooltip>
            <Box>
              <Tooltip title="Open user settings">
                <Button onClick={handleOpenUserMenu} color="inherit">Profile</Button>
              </Tooltip>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                sx={{mt:4}}
              >
                {userSettings.map((setting) => (
                  <MenuItem key={setting} onClick={() => handleMenuItemClick(setting)}>
                    <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Tooltip title="Redirect to Hounslow Council website">
              <Button color="inherit">Hounslow Website</Button>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
  );
}
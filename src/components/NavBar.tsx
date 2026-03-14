import React from 'react';
import { AppBar, Box, Toolbar, Typography, Button, Menu, MenuItem, Tooltip, Stack, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { signOut } from 'aws-amplify/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';


export default function NavBar() {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const [anchorElUser, setAnchorElUser] = React.useState(null);
	const menuDropdown = isAuthenticated
		? ['Account', 'Logout']
		: ['Log in'];

	const handleOpenUserMenu = (event: any) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const handleMenuItemClick = async (dropdown: string) => {
		handleCloseUserMenu();

		if (dropdown === 'Logout') {
			await handleLogout();
		}

		if (dropdown === 'Log in') {
			navigate('/auth');
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

				<Typography
					variant="h6"
					component="div"
					onClick={() => navigate('/')}
					sx={{
						flexGrow: 1,
						cursor: 'pointer',
						display: 'inline-block',
						transition: 'transform 0.15s ease',
						'&:hover': { transform: 'translateY(-2px)' },
					}}
				>
					ResidentsPath
				</Typography>

				<Stack
					direction='row'
					spacing={2}
					sx={{
						'& .MuiButton-root, & .MuiIconButton-root': {
							transition: 'transform 0.15s ease',
							'&:hover': { transform: 'translateY(-2px)' },
						},
					}}
				>
					<Tooltip title="Create your case">
						<Button color="inherit" onClick={() => navigate("/form")}>Form</Button>
					</Tooltip>
					
					<Button
						color="inherit"
						component="a"
						href="https://www.hounslow.gov.uk/"
						target="_blank"
						rel="noopener noreferrer"
					>
						Council Website
					</Button>

					<Box>
						<IconButton onClick={handleOpenUserMenu} color="inherit">
							<AccountCircle />
						</IconButton>
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
							sx={{ mt: 4 }}
							slotProps={{
								paper: {
									sx: {
										borderRadius: 2,
										minWidth: 140,
										boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
									}
								}
							}}
						>
							{menuDropdown.map((setting) => (
								<MenuItem
									key={setting}
									onClick={() => handleMenuItemClick(setting)}
									sx={{
										px: 2.5,
										py: 1,
										'&:hover': { backgroundColor: 'primary.light' },
									}}
								>
									<Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
								</MenuItem>
							))}
						</Menu>
					</Box>
				</Stack>
			</Toolbar>
		</AppBar>
	);
}
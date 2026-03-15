import React from 'react';
import { AppBar, Box, Toolbar, Typography, Button, Menu, MenuItem, Tooltip, Stack, IconButton } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { signOut } from 'aws-amplify/auth';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LanguageSupportButton from './LanguageSupportButton';


export default function NavBar() {
	const navigate = useNavigate();
	const { isAuthenticated } = useAuth();
	const {  t: translate } = useTranslation();
	const [anchorElUser, setAnchorElUser] = React.useState(null);
	const menuDropdown = isAuthenticated
		? [translate("navbar-logout")]
		: [translate("navbar-login")];

	const handleOpenUserMenu = (event: any) => {
		setAnchorElUser(event.currentTarget);
	};

	const handleCloseUserMenu = () => {
		setAnchorElUser(null);
	};

	const handleMenuItemClick = async (dropdown: string) => {
		handleCloseUserMenu();

		if (dropdown === translate("navbar-logout")) {
			await handleLogout();
		}

		if (dropdown === translate("navbar-login")) {
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
					{translate("nav-resident")}
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
					<Tooltip title={translate("nav-show")}>
						<Button color="inherit" onClick={() => navigate('/userdashboard')}>{translate("nav-queue")}</Button>
					</Tooltip>

					<Tooltip title={translate("nav-create")}>
						<Button color="inherit" onClick={() => navigate("/form")}>{translate("nav-form")}</Button>
					</Tooltip>
					
					<Button
						color="inherit"
						component="a"
						href="https://www.hounslow.gov.uk/"
						target="_blank"
						rel="noopener noreferrer"
					>
						{translate("nav-council")}
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

					<Tooltip title={translate("nav-select")}>
						<LanguageSupportButton />
					</Tooltip>
				</Stack>
			</Toolbar>
		</AppBar>
	);
}
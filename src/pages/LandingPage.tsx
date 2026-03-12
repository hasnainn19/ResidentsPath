import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';

// const languages = [
//     { value: "en", text: "English" },
//     { value: "cy", text: "Welsh" },
// 	{ value: "pl", text: "Polish" },
// 	{ value: "pa", text: "Punjabi" },
// 	{ value: "fa", text: "Persian" },
// ];

export default function LandingPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading, givenName } = useAuth();
  	const { t } = useTranslation();

	// Show loading spinner while checking authentication status
	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<>
			<NavBar />
			{/* Show navbar if authenticated */}
			{isAuthenticated && <NavBar />}

			<Container maxWidth="md" sx={{ py: 8 }}>
				{/* Header */}
				<Box sx={{ textAlign: 'center', mb: 6 }}>
					<Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
						{isAuthenticated
							? (givenName ? `${t("landing-welcome-back")}, ${givenName}` : '{t("landing-welcome-back")}')
							: `${t("landing-welcome")}`
						}
					</Typography>
					<Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
						{t("landing-welcome-back")}
					</Typography>
				</Box>

				{/* Cards vary based on authentication status */}
				<Stack spacing={3} alignItems="center">
					{isAuthenticated ? (
						<>
							{/* Option 1: Queue Information and Appointment Check-in */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										Queue Information and Appointment Check-in
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										Check in to your appointment or view your current queue status.
									</Typography>
									<Button
										variant="contained"
										fullWidth
										size="large"
										onClick={() => navigate('/referencepage')}
									>
										Check In
									</Button>
								</CardContent>
							</Card>

							{/* Option 2: Book an Appointment */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										Book an Appointment
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										Schedule an appointment with a department.
									</Typography>
									<Button
										variant="outlined"
										fullWidth
										size="large"
										onClick={() => navigate('/bookingpage')}
									>
										Book Appointment
									</Button>
								</CardContent>
							</Card>
						</>
					) : (
						<>
							{/* Option 1: Continue as Visitor */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										{t("landing-continue-as")}
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{t("landing-no-account")}
									</Typography>
									<Button
										variant="contained"
										fullWidth
										size="large"
										onClick={() => navigate('/referencepage')}
									>
										{t("landing-continue-as")}
									</Button>
								</CardContent>
							</Card>

							{/* Option 2: Sign In / Create Account */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										{t("landing-sign-in")}
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{t("landing-access")}
									</Typography>
									<Button
										variant="outlined"
										fullWidth
										size="large"
										onClick={() => navigate('/auth')}
									>
										{t("landing-register")}
									</Button>
								</CardContent>
							</Card>
						</>
					)}
				</Stack>
			</Container>
		</>
	);
}

import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';

export default function LandingPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading, givenName } = useAuth();
  	const {  t: translate } = useTranslation();

	// Show loading spinner while checking authentication status
	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<>
			<NavBar />

			<Container maxWidth="md" sx={{ py: 8 }}>
				{/* Header */}
				<Box sx={{ textAlign: 'center', mb: 6 }}>
					<Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
						{isAuthenticated
							? (givenName ? `${translate("landing-welcome-back")}, ${givenName}` : `${translate("landing-welcome-back")}`)
							: `${translate("landing-welcome")}`
						}
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
										{translate("landing-queue-info")}
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{translate("landing-check-in-to")}
									</Typography>
									<Button
										variant="contained"
										fullWidth
										size="large"
										onClick={() => navigate('/referencepage')}
									>
										{translate("landing-check")}
									</Button>
								</CardContent>
							</Card>

							{/* Option 2: Create a case with the form */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										Submit an Enquiry
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										Fill in our online form and we'll bring you to the right service
									</Typography>
									<Button
										variant="outlined"
										fullWidth
										size="large"
										onClick={() => navigate('/form')}
									>
										Start Your Enquiry
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
										{translate("landing-continue-as")}
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{translate("landing-no-account")}
									</Typography>
									<Button
										variant="contained"
										fullWidth
										size="large"
										onClick={() => navigate('/form')}
									>
										{translate("landing-continue-as")}
									</Button>
								</CardContent>
							</Card>

							{/* Option 2: Sign In / Create Account */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										{translate("landing-sign-in")}
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										{translate("landing-access")}
									</Typography>
									<Button
										variant="outlined"
										fullWidth
										size="large"
										onClick={() => navigate('/auth')}
									>
										{translate("landing-register")}
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

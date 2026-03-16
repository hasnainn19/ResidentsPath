import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import NavBar from '../components/NavBar';

export default function LandingPage() {
	const navigate = useNavigate();
	const { isAuthenticated, isLoading, givenName } = useAuth();

	// Show loading spinner while checking authentication status
	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<>
			{/* Show navbar if authenticated */}
			{isAuthenticated && <NavBar />}

			<Container maxWidth="md" sx={{ py: 8 }}>
				{/* Header */}
				<Box sx={{ textAlign: 'center', mb: 6 }}>
					<Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
						{isAuthenticated
							? (givenName ? `Welcome back, ${givenName}` : 'Welcome back')
							: 'Welcome to ResidentsPath'
						}
					</Typography>
					<Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
						Hounslow Council Queue Management System
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
										Continue as Visitor
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										No account needed. Get help immediately by submitting an enquiry.
									</Typography>
									<Button
										variant="contained"
										fullWidth
										size="large"
										onClick={() => navigate('/form')}
									>
										Continue as Visitor
									</Button>
								</CardContent>
							</Card>

							{/* Option 2: Sign In / Create Account */}
							<Card sx={{ width: '100%', maxWidth: 500 }}>
								<CardContent sx={{ p: 4 }}>
									<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
										Sign In or Create Account
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										Access your account to book appointments and track your past visits.
									</Typography>
									<Button
										variant="outlined"
										fullWidth
										size="large"
										onClick={() => navigate('/auth')}
									>
										Sign In / Register
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

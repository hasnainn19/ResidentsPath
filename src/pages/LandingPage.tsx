import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button, Stack, Card, CardContent } from '@mui/material';

export default function LandingPage() {
	const navigate = useNavigate();

	return (
		<Container maxWidth="md" sx={{ py: 8 }}>
			{/* Header */}
			<Box sx={{ textAlign: 'center', mb: 6 }}>
				<Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
					Welcome to ResidentsPath
				</Typography>
				<Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
					Hounslow Council Queue Management System
				</Typography>
			</Box>

			{/* Three Options */}
			<Stack spacing={3} alignItems="center">

				{/* Option 1: Continue as Visitor */}
				<Card sx={{ width: '100%', maxWidth: 500 }}>
					<CardContent sx={{ p: 4 }}>
						<Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
							Continue as Visitor
						</Typography>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							No account needed. Get help immediately and check queue status.
						</Typography>
						<Button
							variant="contained"
							fullWidth
							size="large"
							onClick={() => navigate('/referencepage')}
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
			</Stack>
		</Container>
	);
}

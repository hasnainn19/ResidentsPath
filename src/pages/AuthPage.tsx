import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Box, Typography } from '@mui/material';
import { ArrowBackIos } from '@mui/icons-material';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import '@aws-amplify/ui-react/styles.css';

export default function AuthPage() {
	const navigate = useNavigate();
	const { authStatus } = useAuthenticator((context) => [context.authStatus]);

	/**
	 * Watch the auth status and redirect based on user's Cognito group.
	 * Staff users -> /staff/dashboard
	 * Resident users -> /resident/dashboard
	 *
	 * For new signups, the post-confirmation Lambda adds the user to "Residents" group.
	 * We force a token refresh to ensure we have the latest group membership.
	 */
	useEffect(() => {
		const checkGroupsAndRedirect = async () => {
			if (authStatus === 'authenticated') {
				try {
					// Force refresh to get the latest token with group assignments
					const session = await fetchAuthSession({ forceRefresh: true });
					const groups = session.tokens?.accessToken?.payload['cognito:groups'] as string[] | undefined;

					// Check if user is staff
					if (groups?.includes('Staff')) {
						navigate('/staff/dashboard');
					}
					else {
						// Default to resident dashboard for residents or users with no group
						navigate('/resident/dashboard');
					}
				}
				catch (error) {
					console.error('Error fetching auth session:', error);
				}
			}
		};

		checkGroupsAndRedirect();
	}, [authStatus, navigate]);

	return (
		<Container maxWidth="sm" sx={{ py: 6 }}>
			<Box sx={{ textAlign: 'center', mb: 2 }}>
				<Typography variant="h4" gutterBottom>
					Welcome to ResidentsPath
				</Typography>
				<Typography variant="body1" color="text.secondary">
					Sign in to your account or create a new one to access appointments and track your past visits.
				</Typography>
			</Box>

			<Box sx={{ mb: 4, textAlign: 'center' }}>
				<Button
					onClick={() => navigate('/')}
					startIcon={<ArrowBackIos sx={{ fontSize: '0.9rem' }} />}
					sx={{
						textTransform: 'none',
						color: 'text.primary',
						fontSize: '1rem',
						fontWeight: 500,
						'&:hover': {
							backgroundColor: 'transparent',
							color: 'primary.main'
						}
					}}
				>
					Go Back
				</Button>
			</Box>

			{/* Amplify Authenticator component handles sign-in/sign-up flows */}
			{/* Tied with the Cognito auth configuration in amplify/auth/resource.ts */}
			<Authenticator
				signUpAttributes={['email', 'given_name', 'family_name']}
				loginMechanisms={['email']}
				formFields={{
					signUp: {
						given_name: {
							label: 'First Name',
							placeholder: 'Enter your first name',
							isRequired: true
						},
						family_name: {
							label: 'Last Name',
							placeholder: 'Enter your last name',
							isRequired: true
						}
					}
				}}
			/>
		</Container>
	);
}

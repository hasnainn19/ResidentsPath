import { useNavigate } from 'react-router-dom';
import { Container, Button, Box, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useTranslation } from 'react-i18next';
import { Authenticator  } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import NavBar from '../components/NavBar';
import React from 'react';
import { I18n } from 'aws-amplify/utils';

export default function AuthPage() {
	const navigate = useNavigate();
	const {  t: translate, i18n } = useTranslation();
	const [key, setKey] = React.useState(0);

	React.useEffect(() => {
		I18n.setLanguage(i18n.language);
		setKey(prev => prev + 1);
	}, [i18n.language]);

	return (
		<>
			<NavBar />
			<Container maxWidth="sm" sx={{ py: 6 }}>
				<Box sx={{ textAlign: 'center', mb: 2 }}>
					<Typography variant="h4" gutterBottom>
						{translate("landing-welcome")}
					</Typography>
					<Typography variant="body1" color="text.secondary">
						{translate("auth-sign")}
					</Typography>
				</Box>

				<Box sx={{ mb: 4, textAlign: 'center' }}>
					<Button
						onClick={() => navigate(-1)}
						startIcon={<ArrowBackIosIcon sx={{ fontSize: '0.9rem' }} />}
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
						{translate("access-go")}
					</Button>
				</Box>
				<Authenticator
					key={key}
					signUpAttributes={['email', 'given_name', 'family_name']}
					loginMechanisms={['email']}
					formFields={{
						signUp: {
							given_name: {
								label: translate("auth-first"),
								placeholder: translate("auth-enter"),
								isRequired: true
							},
							family_name: {
								label: translate("auth-last"),
								placeholder: translate("auth-enter-last"),
								isRequired: true
							}
						}
					}}
				/>
			</Container>
		</>
	);
}

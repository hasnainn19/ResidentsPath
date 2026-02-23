import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { ThemeProvider } from '@mui/material/styles';
import theme from './Constants/Theme';
import { CssBaseline } from '@mui/material'
import { Authenticator, ThemeProvider as AmplifyThemeProvider } from '@aws-amplify/ui-react'
import { amplifyComponentsTheme } from './Constants/AmplifyTheme'
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
Amplify.configure(outputs);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<AmplifyThemeProvider theme={amplifyComponentsTheme}>
					<Authenticator.Provider>
						<RouterProvider router={router} />
					</Authenticator.Provider>
				</AmplifyThemeProvider>
			</ThemeProvider>
		</LocalizationProvider>
	</StrictMode>
)

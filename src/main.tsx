import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { ThemeProvider } from '@mui/material/styles';
import theme from './Constants/Theme';
import { CssBaseline } from '@mui/material'
import { Authenticator } from '@aws-amplify/ui-react'

import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
Amplify.configure(outputs);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Authenticator.Provider>
				<RouterProvider router={router} />
			</Authenticator.Provider>
		</ThemeProvider>
	</StrictMode>
)

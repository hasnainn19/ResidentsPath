import { createTheme } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6d3874',      
      light: '#e0d4fd',
      dark: '#652f6c',
    },
    secondary: {
      main: '#f7f7f7',    
    },
    error: {
      main: '#d32f2f',
    },
    success:{
        main: '#defbd3',
    },
    warning:{
        main: '#fdfde9',
    },
    background: {
      default: '#f7f7f7',   
      paper: '#ffffff',     
    },
    text: {
      primary: '#000000',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif'
  }
});

export default theme;

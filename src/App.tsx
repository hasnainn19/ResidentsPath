import {Box, Typography} from '@mui/material';
import './App.css'
import NavBar from './components/NavBar'

function App() {

  return (
    <Box sx={{ width: '100vw', height:'100vh' }}>
      <NavBar />
      <Typography variant='h1' align='center'> Start page</Typography>
    </Box>
  );
}

export default App

import {
  Grid,
  Paper,
  Box,
  TextField,
  Typography,
  Button,
  styled
} from '@mui/material';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';

export default function ReferencePage() {

// hounslow dark purple
// #652F6C 
// houslow light puple
// #E0D4FD

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(3),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

const ScanBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  height: 180,
  backgroundColor: '#E0D4FD',
  border: '2px dashed',
  borderColor: theme.palette.grey[600],
  borderRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
  cursor: 'pointer',

  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));


return (
    <div className="reference-page">
        <h1>Use one of the following methods to view your queue details</h1>
        <Grid container 
            spacing={3} 
            direction="row"
            alignItems="stretch"
            sx={{ justifyContent: "center", }}
        >
            <Grid sx={{ display: 'flex'}} size={4}>
                <Item sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                    <SearchRoundedIcon />
                    <h3>Manual Entry</h3>
                    <h4>Enter your reference code here:</h4>
                    <Box sx={{ mt: 'auto', width: '100%', maxWidth: 480, mx: 'auto' }}>
                        <TextField
                            id="outlined-basic"
                            variant="outlined"
                            fullWidth
                            placeholder="Reference code"
                            sx={{ mb: 2 }}
                        />
                        <Button
                            variant="contained"
                            endIcon={<EastRoundedIcon />}
                            sx={{
                                backgroundColor: '#652F6C',
                                color: '#fff',
                                width: '100%',
                                '&:hover': { backgroundColor: '#502555' },
                            }}
                        >
                            Check Status
                        </Button>
                    </Box>
                </Item>
            </Grid>

            <Grid sx={{ display: 'flex'}} size={4}>
                <Item sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
                    <QrCode2OutlinedIcon />
                    <h3>Scan QR Code</h3>
                    <h4>Click to use the camera to scan the QR code:</h4>

                    <Box sx={{ mt: 'auto', width: '100%', maxWidth: 480, mx: 'auto' }}>
                        <ScanBox onClick={() => console.log('Start camera')} sx={{ width: '100%' }}>
                            <QrCodeScannerRoundedIcon fontSize="large" />
                            <Box mt={1}>Tap to start camera</Box>
                        </ScanBox>
                    </Box>
                </Item>
            </Grid>

        </Grid>
    </div>
)

}

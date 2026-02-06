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

export default function ReferencePage() {

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles('dark', {
    backgroundColor: '#1A2027',
  }),
}));

const ScanBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  height: 180,
  border: '2px dashed',
  borderColor: theme.palette.grey[300],
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
        <Grid container spacing={3}>
            <Grid size="grow">
                <Item>
                    <SearchRoundedIcon />
                    <h3>Manual Entry</h3>
                    <h4>Enter your reference code here:</h4>
                    <TextField id="outlined-basic" variant="outlined" fullWidth />
                    <Button variant="contained" endIcon={<EastRoundedIcon />} sx={{ mt: 2, width: '100%' }}>
                        Check Status
                    </Button>
                </Item>
            </Grid>

            <Grid size="grow">
                <Item>
                    <QrCodeScannerRoundedIcon />
                    <h3>Scan QR Code</h3>
                    <h4>Click to use the camera to scan the QR code:</h4>

                    <ScanBox onClick={() => console.log('Start camera')}>
                    <QrCodeScannerRoundedIcon fontSize="large" />
                    <Box mt={1}>Tap to start camera</Box>
                    </ScanBox>
                </Item>
            </Grid>

        </Grid>
    </div>
)

}

import {
  Grid,
  Paper,
  Box,
  TextField,
  Button,
  styled,
  Card,
  CardContent,
  CardActions,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Avatar from '@mui/material/Avatar';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import QrCodeScannerRoundedIcon from '@mui/icons-material/QrCodeScannerRounded';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ButtonBase from '@mui/material/ButtonBase';


export default function ReferencePage() {

// hounslow dark purple
// #652F6C 
// houslow light puple
// #E0D4FD



const ScanButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  minHeight: 180,
  backgroundColor: '#E0D4FD',
  border: `2px dashed ${grey[600]}`,
  borderRadius: theme.shape.borderRadius * 2,
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    backgroundColor: '#e3d9faff',
    borderColor: grey[900],
  }
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
            <Grid item sx={{ display: 'flex'}} size={4}>
            <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, borderRadius: 3 }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Avatar sx={{ bgcolor: '#E0D4FD', color: '#652F6C' }}>
                    <SearchRoundedIcon />
                </Avatar>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                Manual Entry
                </Typography>

                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                Enter your reference code here:
                </Typography>

                <Box sx={{ mt: 'auto', width: '100%', maxWidth: 480, mx: 'auto' }}>
                    <TextField fullWidth placeholder="Reference code" sx={{ mb: 2 }} />
                </Box>
                </CardContent>

                <CardActions sx={{ px: 3, pb: 3 }}>
                <Box sx={{ width: '100%', maxWidth: 480, mx: 'auto' }}>
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
                </CardActions>
            </Card>
            </Grid>

            <Grid item sx={{ display: 'flex'}} size={4}>
                <Card sx={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', borderRadius: 3 }}>
                <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Avatar sx={{ bgcolor: '#652F6C' }}>
                    <QrCode2OutlinedIcon />
                    </Avatar>
                    <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Scan QR Code
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700, mb: 2 }}>
                    Click to use the camera to scan the QR code:
                    </Typography>
                </CardContent>

                <CardActions sx={{ px: 3, pb: 3, justifyContent: 'center' }}>
                    <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto' }}>
                    <ScanButton
                        onClick={() => console.log('Start QR scanner')}
                        aria-label="Start QR scanner"
                        sx={{
                        width: '100%',
                        flexDirection: 'column',   // stack icon above text
                        py: 3,                     // vertical padding to make the box taller
                        }}
                    >
                        <QrCodeScannerRoundedIcon fontSize="large" />
                        <Box component="span" sx={{ mt: 2, fontWeight: 600 }}>
                        Tap to start camera
                        </Box>
                    </ScanButton>
                    </Box>
                </CardActions>
                </Card>
            </Grid>
        </Grid>

    </div>
)

}

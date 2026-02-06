import { Grid } from '@mui/material';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';

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

return (
    <div className="reference-page">
        <h1>Reference & QR Code Page</h1>
        <Grid container spacing={3}>
            <Grid size="grow">
                <Item>
                    Manual Entry
                </Item>
            </Grid>

            <Grid size="grow">
                <Item>
                    Scan QR Code
                </Item>
            </Grid>
        </Grid>
    </div>
)

}

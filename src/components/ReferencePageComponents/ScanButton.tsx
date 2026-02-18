import type { ReactNode } from "react";
import { ButtonBase } from "@mui/material";
import { grey } from '@mui/material/colors';
import { styled } from '@mui/material/styles';

// Styled component for the QR scanner button
const StyledScanButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.secondary.light,
  border: `2px dashed ${grey[600]}`,
  borderRadius: 8,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: theme.palette.secondary.main,
    borderColor: grey[900],
  },
}));

export default function ScanButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <StyledScanButton onClick={onClick}>{children}</StyledScanButton>;
}
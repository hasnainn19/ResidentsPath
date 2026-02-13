import { type ReactNode, useId } from "react";
import { Box, Checkbox, Typography } from "@mui/material";

export default function LeftCheckRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
      <Checkbox
        id={id}
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        sx={{ mt: 0.25, mr: 1, p: 0 }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography component="label" htmlFor={id} sx={{ mt: 0.45, textAlign: "left", cursor: "pointer" }}>
          {props.label}
        </Typography>
        {props.children}
      </Box>
    </Box>
  );
}

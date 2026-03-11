/**
 * Checkbox row with left-aligned label, with space for follow-up content underneath.
 *
 * Used for questions where ticking a box reveals extra inputs. It handles linking the label
 * to the checkbox id.
 */

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
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: { xs: 1.25, sm: 0 } }}>
      <Checkbox
        slotProps={{ input: { id } }}
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
        sx={{ mt: 0.25, mr: { xs: 0, sm: 1 }, p: { xs: 0.5, sm: 0 } }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="label"
          htmlFor={id}
          sx={{ mt: 0.45, textAlign: "left", cursor: "pointer", lineHeight: { xs: 1.35, sm: "inherit" } }}
        >
          {props.label}
        </Typography>
        {props.children}
      </Box>
    </Box>
  );
}
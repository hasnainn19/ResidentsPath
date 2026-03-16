import { Box, ButtonBase, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

type Props = {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
};

// A tile component for selecting options
export default function OptionTile({
  title,
  description,
  selected,
  onClick,
  disabled = false,
}: Props) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: "100%",
        textAlign: "left",
        borderRadius: 2,
      }}
    >
      <Box
        sx={({ palette }) => {
          const accent = palette.primary.main;

          return {
            width: "100%",
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: selected ? accent : palette.divider,
            bgcolor: selected ? alpha(accent, 0.08) : "transparent",
            opacity: disabled ? 0.55 : 1,
            transition: "border-color 120ms ease, background-color 120ms ease, opacity 120ms ease",
          };
        }}
      >
        <Typography fontWeight={800}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

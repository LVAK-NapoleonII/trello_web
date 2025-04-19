import { Box, Typography } from "@mui/material";

function DescriptionSection({ card }) {
  if (!card.description) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        color={(theme) => theme.palette.text.primary}
        gutterBottom
      >
        Mô tả
      </Typography>
      <Typography
        variant="body2"
        color={(theme) => theme.palette.text.secondary}
      >
        {card.description}
      </Typography>
    </Box>
  );
}

export default DescriptionSection;

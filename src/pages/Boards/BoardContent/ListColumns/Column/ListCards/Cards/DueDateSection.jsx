import { Box, Typography } from "@mui/material";

function DueDateSection({ card }) {
  if (!card.dueDate) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle2"
        color={(theme) => theme.palette.text.primary}
        gutterBottom
      >
        Hạn chót
      </Typography>
      <Typography
        variant="body2"
        color={(theme) => theme.palette.text.secondary}
      >
        {new Date(card.dueDate).toLocaleString()}
      </Typography>
    </Box>
  );
}

export default DueDateSection;

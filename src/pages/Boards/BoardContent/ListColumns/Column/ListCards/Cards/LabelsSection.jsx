import { Box, Typography, Chip, Stack } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

const LabelsSection = ({ labels }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <LabelIcon fontSize="small" color="action" />
      <Typography variant="h6" color="text.primary">
        Nhãn
      </Typography>
    </Box>
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {labels.map((label, index) => (
        <Chip
          key={index}
          label={label}
          size="small"
          sx={{
            bgcolor: "secondary.main",
            color: "secondary.contrastText",
          }}
        />
      ))}
    </Stack>
  </Box>
);

export default LabelsSection;

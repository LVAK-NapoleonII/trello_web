import { Box, Typography, Stack, Chip } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

function LabelsSection({ card }) {
  if (!(card.labels || []).length) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <LabelIcon
          fontSize="small"
          sx={{ color: (theme) => theme.palette.action.active }}
        />
        <Typography
          variant="subtitle2"
          color={(theme) => theme.palette.text.primary}
        >
          Nhãn
        </Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(card.labels || []).map((label, index) => (
          <Chip
            key={index}
            label={label}
            size="small"
            sx={{
              bgcolor: (theme) =>
                theme.palette.mode === "light"
                  ? theme.palette.secondary.light
                  : theme.palette.secondary.dark,
              color: (theme) => theme.palette.secondary.contrastText,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default LabelsSection;

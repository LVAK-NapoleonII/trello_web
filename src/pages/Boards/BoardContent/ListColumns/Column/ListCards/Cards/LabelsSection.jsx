import { Box, Typography, Chip, Stack } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";
import { useTheme } from "@mui/material/styles";

const LabelsSection = ({ labels }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <LabelIcon
          fontSize="small"
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.action.active,
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: isDarkMode
              ? theme.palette.grey[200]
              : theme.palette.text.primary,
          }}
        >
          Nhãn
        </Typography>
      </Box>
      {labels?.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {labels.map((label, index) => {
            // Giả sử label có thể là string hoặc object { text, color }
            const labelText = typeof label === "object" ? label.text : label;
            const labelColor =
              typeof label === "object" && label.color
                ? label.color
                : theme.palette.secondary.main;
            return (
              <Chip
                key={index}
                label={labelText}
                size="small"
                sx={{
                  bgcolor: labelColor,
                  color: theme.palette.getContrastText(labelColor),
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? theme.palette.grey[700]
                      : theme.palette.grey[200],
                  },
                }}
              />
            );
          })}
        </Stack>
      ) : (
        <Typography
          sx={{
            color: isDarkMode
              ? theme.palette.grey[400]
              : theme.palette.text.secondary,
          }}
        >
          Chưa có nhãn nào.
        </Typography>
      )}
    </Box>
  );
};

export default LabelsSection;

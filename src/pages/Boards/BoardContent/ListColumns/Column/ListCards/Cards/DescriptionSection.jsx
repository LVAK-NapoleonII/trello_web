import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const DescriptionSection = ({ description }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{
          color: isDarkMode
            ? theme.palette.grey[200]
            : theme.palette.text.primary,
          mb: 1,
        }}
      >
        Mô tả
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: isDarkMode
            ? theme.palette.grey[400]
            : theme.palette.text.secondary,
        }}
      >
        {description || "Chưa có mô tả."}
      </Typography>
    </Box>
  );
};

export default DescriptionSection;

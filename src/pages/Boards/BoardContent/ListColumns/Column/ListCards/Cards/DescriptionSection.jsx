import { Box, Typography } from "@mui/material";

const DescriptionSection = ({ description }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" color="text.primary" gutterBottom>
      Mô tả
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

export default DescriptionSection;

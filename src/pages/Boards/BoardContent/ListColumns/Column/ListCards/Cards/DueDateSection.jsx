import { Box, Typography } from "@mui/material";

const DueDateSection = ({ dueDate }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" color="text.primary" gutterBottom>
      Hạn chót
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {new Date(dueDate).toLocaleString()}
    </Typography>
  </Box>
);

export default DueDateSection;

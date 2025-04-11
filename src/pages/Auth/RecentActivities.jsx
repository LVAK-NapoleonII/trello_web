import { Box, Typography, Divider } from "@mui/material";

const RecentActivities = ({ activities, userName }) => {
  return (
    <Box sx={{ mt: 4, textAlign: "left" }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Hoạt động gần đây của {userName}
      </Typography>
      {activities.map((activity) => (
        <Box key={activity.id} sx={{ mb: 1 }}>
          <Typography variant="body2" color="textSecondary">
            {activity.text}
          </Typography>
          <Divider sx={{ my: 1 }} />
        </Box>
      ))}
    </Box>
  );
};

export default RecentActivities;

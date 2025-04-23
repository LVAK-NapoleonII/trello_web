import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { formatDistanceToNow } from "date-fns";
import vi from "date-fns/locale/vi";

const RecentActivities = ({
  activities,
  userName,
  onHideActivity,
  onHideAllActivities,
  onActivityClick,
}) => {
  return (
    <Box sx={{ mt: 4, textAlign: "left" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Hoạt động gần đây của {userName}
        </Typography>
        {activities.length > 0 && (
          <Button size="small" onClick={onHideAllActivities} color="error">
            Ẩn tất cả
          </Button>
        )}
      </Box>
      {activities.length === 0 ? (
        <Typography color="text.secondary">Không có hoạt động nào</Typography>
      ) : (
        <List dense sx={{ py: 0 }}>
          {activities.map((activity) => (
            <Box key={activity._id}>
              <ListItem
                sx={{
                  borderRadius: 1,
                  py: 0.5,
                  px: 1,
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => onActivityClick(activity)}
              >
                <ListItemText
                  primary={activity.details || "Không có chi tiết"}
                  secondary={formatDistanceToNow(new Date(activity.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                  primaryTypographyProps={{
                    variant: "body2",
                    noWrap: true,
                    sx: { maxWidth: 350 },
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
                <IconButton
                  edge="end"
                  onClick={() => onHideActivity(activity._id)}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
};

export default RecentActivities;

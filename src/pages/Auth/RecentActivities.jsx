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
import { motion } from "framer-motion";

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
          <Button
            size="small"
            onClick={onHideAllActivities}
            color="error"
            sx={{ textTransform: "none", borderRadius: 8 }}
          >
            Ẩn tất cả
          </Button>
        )}
      </Box>
      {activities.length === 0 ? (
        <Typography color="text.secondary">Không có hoạt động nào</Typography>
      ) : (
        <List dense sx={{ py: 0 }}>
          {activities.map((activity, index) => (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <ListItem
                sx={{
                  borderRadius: 8,
                  py: 1,
                  px: 2,
                  mb: 1,
                  background: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.03)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  "&:hover": {
                    background: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.05)",
                    transform: "scale(1.02)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  },
                  transition: "all 0.2s ease",
                  cursor: "pointer",
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
                    fontWeight: "medium",
                    sx: { maxWidth: 300 },
                  }}
                  secondaryTypographyProps={{
                    variant: "caption",
                    color: "text.secondary",
                  }}
                />
                <IconButton
                  edge="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHideActivity(activity._id);
                  }}
                  sx={{
                    "&:hover": { color: (theme) => theme.palette.error.main },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItem>
            </motion.div>
          ))}
        </List>
      )}
    </Box>
  );
};

export default RecentActivities;

import {
  Avatar,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  CircularProgress,
} from "@mui/material";
import { deepPurple } from "@mui/material/colors";

const RecentActivities = ({ activities, userName, loading }) => {
  return (
    <Box sx={{ mt: 4, textAlign: "left" }}>
      <Typography variant="h6" fontWeight="bold">
        Hoạt động gần đây
      </Typography>

      {/* ✅ Nếu đang loading -> Hiển thị vòng xoay */}
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 150,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: "300px", // ✅ Giới hạn chiều cao
            overflowY: "auto", // ✅ Thanh cuộn dọc khi danh sách quá dài
            pr: 1, // ✅ Tạo khoảng trống tránh che nội dung
            opacity: loading ? 0.5 : 1, // ✅ Hiệu ứng mượt mà khi dữ liệu tải xong
            transition: "opacity 0.3s ease-in-out",
          }}
        >
          <List>
            {activities.length === 0 ? (
              <Typography sx={{ textAlign: "center", mt: 2, color: "gray" }}>
                Không có hoạt động nào gần đây.
              </Typography>
            ) : (
              activities.map((activity) => (
                <ListItem key={activity.id}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: deepPurple[500], width: 32, height: 32 }}
                    >
                      {userName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={activity.text} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default RecentActivities;

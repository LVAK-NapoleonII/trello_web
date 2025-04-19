import { useState, useEffect, useContext } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Button,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TemplateIcon from "@mui/icons-material/Category";
import HomeIcon from "@mui/icons-material/Home";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import StarIcon from "@mui/icons-material/Star";
import ImageIcon from "@mui/icons-material/Image";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SocketContext } from "../../../context/SocketContext";

const Sidebar = ({ onSelectWorkspace, selectedWorkspaceId }) => {
  const socket = useContext(SocketContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [openWorkspaces, setOpenWorkspaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [newWorkspaceIsPublic, setNewWorkspaceIsPublic] = useState(false);
  const [newWorkspaceBackground, setNewWorkspaceBackground] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token!");
      }

      const response = await axios.get("http://localhost:5000/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkspaces(response.data);

      const initialOpenState = {};
      response.data.forEach((workspace) => {
        initialOpenState[workspace._id] = true;
      });
      setOpenWorkspaces(initialOpenState);
    } catch (error) {
      console.error("Lỗi tải workspaces:", error);
      toast.error("Không thể tải danh sách không gian làm việc!");
      if (error.response?.status === 401 || error.message.includes("token")) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("join", userId);
      console.log("Sidebar tham gia phòng socket:", userId);
    }

    fetchWorkspaces();

    socket.on("workspaces-loaded", (workspaceIds) => {
      workspaceIds.forEach((workspaceId) => {
        socket.emit("join", workspaceId);
        console.log("Sidebar tham gia phòng workspace:", workspaceId);
      });
    });

    socket.on("workspace-created", (data) => {
      console.log("Nhận workspace-created:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
      setOpenWorkspaces((prev) => ({
        ...prev,
        [data.workspace._id]: true,
      }));
      // Tham gia phòng workspace mới
      socket.emit("join", data.workspace._id);
    });

    socket.on("workspace-updated", (data) => {
      console.log("Nhận workspace-updated:", data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
      );
    });

    socket.on("workspace-hidden", (data) => {
      console.log("Nhận workspace-hidden:", data);
      setWorkspaces((prev) => {
        const updated = prev.filter((ws) => ws._id !== data.workspaceId);
        console.log("Danh sách workspaces sau khi xóa:", updated);
        return updated;
      });
      setOpenWorkspaces((prev) => {
        const newOpenWorkspaces = { ...prev };
        delete newOpenWorkspaces[data.workspaceId];
        console.log("Open workspaces sau khi xóa:", newOpenWorkspaces);
        return newOpenWorkspaces;
      });
      if (selectedWorkspaceId === data.workspaceId) {
        console.log("Reset selectedWorkspaceId");
        onSelectWorkspace("");
      }
    });

    socket.on("member-deactivated", (data) => {
      console.log("Nhận member-deactivated:", data);
      if (data.deactivatedUserId === localStorage.getItem("userId")) {
        if (data.workspaceRemoved) {
          // Xóa workspace khỏi danh sách
          setWorkspaces((prev) =>
            prev.filter((ws) => ws._id !== data.board.workspace._id)
          );
          setOpenWorkspaces((prev) => {
            const newOpenWorkspaces = { ...prev };
            delete newOpenWorkspaces[data.board.workspace._id];
            return newOpenWorkspaces;
          });
          if (selectedWorkspaceId === data.board.workspace._id) {
            onSelectWorkspace("");
          }
        }
      }
    });

    socket.on("refresh-sidebar", (data) => {
      console.log("Nhận refresh-sidebar:", data);
      if (data.userId === localStorage.getItem("userId")) {
        fetchWorkspaces();
      }
    });

    return () => {
      socket.off("workspaces-loaded");
      socket.off("workspace-created");
      socket.off("workspace-updated");
      socket.off("workspace-hidden");
      socket.off("member-deactivated");
      socket.off("refresh-sidebar");
    };
  }, [navigate, socket, onSelectWorkspace, selectedWorkspaceId]);

  const handleToggleWorkspace = (workspaceId) => {
    setOpenWorkspaces((prev) => ({
      ...prev,
      [workspaceId]: !prev[workspaceId],
    }));
  };

  const handleNavigation = (path, workspaceId) => {
    if (path === "boards" && onSelectWorkspace) {
      onSelectWorkspace(workspaceId);
      navigate("/boards");
    } else {
      navigate(`/workspace/${workspaceId}/${path}`);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setError("Tên không gian làm việc không được để trống!");
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Vui lòng đăng nhập để tạo không gian làm việc!");
      }

      const response = await axios.post(
        "http://localhost:5000/api/workspaces",
        {
          name: newWorkspaceName,
          description: newWorkspaceDescription,
          isPublic: newWorkspaceIsPublic,
          background: newWorkspaceBackground,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("workspace-created", {
        workspace: response.data,
        message: `Workspace "${response.data.name}" đã được tạo.`,
      });

      setOpenCreateDialog(false);
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setNewWorkspaceIsPublic(false);
      setNewWorkspaceBackground("");
      toast.success("Tạo không gian làm việc thành công!");
      fetchWorkspaces();
    } catch (error) {
      console.error("Lỗi tạo workspace:", error);
      const message =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi tạo không gian làm việc!";
      setError(message);
      toast.error(message);
      if (message.includes("đăng nhập")) {
        navigate("/login");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/workspaces/${workspaceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Xóa không gian làm việc thành công!");
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));
      setOpenWorkspaces((prev) => {
        const newOpenWorkspaces = { ...prev };
        delete newOpenWorkspaces[workspaceId];
        return newOpenWorkspaces;
      });
      if (selectedWorkspaceId === workspaceId) {
        onSelectWorkspace("");
      }
    } catch (error) {
      console.error("Lỗi xóa workspace:", error);
      toast.error("Có lỗi xảy ra khi xóa không gian làm việc!");
    }
  };

  return (
    <Box
      sx={{
        width: 250,
        bgcolor: isDarkMode ? "#1E1E2D" : "#F2F2F5",
        color: isDarkMode ? "#fff" : "#333",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        borderRadius: "20px",
        boxShadow: isDarkMode
          ? "0px 4px 12px rgba(0,0,0,0.5)"
          : "0px 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: isDarkMode ? "#2A2A3D" : "#E6E6EB",
            borderRadius: "10px",
            margin: "4px 0",
          },
          "&::-webkit-scrollbar-thumb": {
            background: isDarkMode ? "#666" : "#bbb",
            borderRadius: "10px",
            border: "1px solid transparent",
            backgroundClip: "padding-box",
            "&:hover": {
              background: isDarkMode ? "#888" : "#999",
            },
          },
        }}
      >
        <List>
          <ListItemButton onClick={() => navigate("/boards")}>
            <ListItemIcon
              sx={{
                borderRadius: "8px",
                "&:hover": { bgcolor: isDarkMode ? "#29293D" : "#E6E6EB" },
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Bảng" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/templates")}>
            <ListItemIcon
              sx={{
                borderRadius: "8px",
                "&:hover": { bgcolor: isDarkMode ? "#29293D" : "#E6E6EB" },
              }}
            >
              <TemplateIcon />
            </ListItemIcon>
            <ListItemText primary="Mẫu" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate("/")}>
            <ListItemIcon
              sx={{
                borderRadius: "8px",
                "&:hover": { bgcolor: isDarkMode ? "#29293D" : "#E6E6EB" },
              }}
            >
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Trang chủ" />
          </ListItemButton>
        </List>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              pl: 2,
              mt: 2,
              opacity: 0.7,
              color: isDarkMode ? "#aaa" : "#666",
            }}
          >
            CÁC KHÔNG GIAN LÀM VIỆC
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{
              color: isDarkMode ? "#fff" : "#333",
              "&:hover": { bgcolor: isDarkMode ? "#29293D" : "#E6E6EB" },
            }}
          >
            Tạo
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List>
            {workspaces.map((workspace) => (
              <div key={workspace._id}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ListItemButton
                    onClick={() => handleToggleWorkspace(workspace._id)}
                    sx={{
                      flex: 1,
                      borderRadius: "8px",
                      background: workspace.background
                        ? `url(${workspace.background}) no-repeat center/cover`
                        : isDarkMode
                        ? "#29293D"
                        : "#E6E6EB",
                      "&:hover": {
                        background: workspace.background
                          ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${workspace.background}) no-repeat center/cover`
                          : isDarkMode
                          ? "#3A3A50"
                          : "#D5D5E0",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isDarkMode ? "#fff" : "#555" }}>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary={workspace.name} />
                    {openWorkspaces[workspace._id] ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemButton>
                  <IconButton
                    onClick={() => handleDeleteWorkspace(workspace._id)}
                    sx={{
                      color: isDarkMode ? "#ff6b6b" : "#d63031",
                      "&:hover": {
                        bgcolor: isDarkMode ? "#3A3A50" : "#D5D5E0",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Collapse
                  in={openWorkspaces[workspace._id]}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    <ListItemButton
                      onClick={() => handleNavigation("boards", workspace._id)}
                    >
                      <ListItemIcon
                        sx={{ color: isDarkMode ? "#fff" : "#555" }}
                      >
                        <DashboardIcon />
                      </ListItemIcon>
                      <ListItemText primary="Bảng" />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() =>
                        handleNavigation("highlights", workspace._id)
                      }
                    >
                      <ListItemIcon
                        sx={{ color: isDarkMode ? "#fff" : "#555" }}
                      >
                        <StarIcon />
                      </ListItemIcon>
                      <ListItemText primary="Điểm nổi bật" />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => handleNavigation("images", workspace._id)}
                    >
                      <ListItemIcon
                        sx={{ color: isDarkMode ? "#fff" : "#555" }}
                      >
                        <ImageIcon />
                      </ListItemIcon>
                      <ListItemText primary="Hình" />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() => handleNavigation("members", workspace._id)}
                    >
                      <ListItemIcon
                        sx={{ color: isDarkMode ? "#fff" : "#555" }}
                      >
                        <PeopleIcon />
                      </ListItemIcon>
                      <ListItemText primary="Thành viên" />
                    </ListItemButton>
                    <ListItemButton
                      onClick={() =>
                        handleNavigation("settings", workspace._id)
                      }
                    >
                      <ListItemIcon
                        sx={{ color: isDarkMode ? "#fff" : "#555" }}
                      >
                        <SettingsIcon />
                      </ListItemIcon>
                      <ListItemText primary="Cài đặt" />
                    </ListItemButton>
                  </List>
                </Collapse>
              </div>
            ))}
            {workspaces.length === 0 && (
              <Typography sx={{ pl: 2, color: isDarkMode ? "#aaa" : "#666" }}>
                Không có không gian làm việc
              </Typography>
            )}
          </List>
        )}
      </Box>
      <Box
        sx={{
          bgcolor: isDarkMode ? "#333347" : "#e8eaf6",
          borderRadius: 2,
          p: 2,
          textAlign: "center",
          borderTop: `1px solid ${isDarkMode ? "#444" : "#ddd"}`,
        }}
      >
        <Typography
          variant="body2"
          sx={{ opacity: 0.8, mb: 1, color: isDarkMode ? "#ddd" : "#444" }}
        >
          Nhận các bảng không giới hạn, tự động hóa nâng cao và hơn thế nữa.
        </Typography>
        <Button
          variant="contained"
          startIcon={<UpgradeIcon />}
          sx={{
            bgcolor: isDarkMode ? "#ff6b6b" : "#d63031",
            "&:hover": { bgcolor: isDarkMode ? "#e63946" : "#b22222" },
            textTransform: "none",
          }}
        >
          Nâng cấp
        </Button>
      </Box>
      <Dialog
        open={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false);
          setError(null);
        }}
      >
        <DialogTitle>Tạo không gian làm việc mới</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên không gian làm việc"
            fullWidth
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            error={!!error && error.includes("Tên")}
            helperText={error && error.includes("Tên") ? error : ""}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            value={newWorkspaceDescription}
            onChange={(e) => setNewWorkspaceDescription(e.target.value)}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newWorkspaceIsPublic}
                onChange={(e) => setNewWorkspaceIsPublic(e.target.checked)}
                color="primary"
              />
            }
            label="Công khai"
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="URL Background (nếu có)"
            fullWidth
            value={newWorkspaceBackground}
            onChange={(e) => setNewWorkspaceBackground(e.target.value)}
            placeholder="Nhập URL hình ảnh background"
          />
          {error && !error.includes("Tên") && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCreateDialog(false);
              setError(null);
            }}
            disabled={createLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateWorkspace}
            variant="contained"
            disabled={createLoading || !newWorkspaceName.trim()}
            startIcon={createLoading ? <CircularProgress size={16} /> : null}
          >
            {createLoading ? "Đang tạo..." : "Tạo"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;

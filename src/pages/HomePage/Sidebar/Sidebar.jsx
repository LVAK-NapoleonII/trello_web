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
  Tooltip,
  Fade,
  Alert,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Folder as FolderIcon,
  Star as StarIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Upgrade as UpgradeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExitToApp as ExitToAppIcon,
  Public as PublicIcon,
  AccountBox as AccountBoxIcon,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SocketContext } from "../../../context/SocketContext";

const handleApiError = (error, navigate, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  if (error.response?.status === 401 || error.message.includes("token")) {
    navigate("/login");
  }
  return message;
};

const Sidebar = ({
  onSelectWorkspace,
  selectedWorkspaceId,
  workspaces,
  setWorkspaces,
  deletedWorkspaces,
  setDeletedWorkspaces,
}) => {
  const { socket, socketReady, userId, joinWorkspaceRoom } = useContext(SocketContext);
  const [openWorkspaces, setOpenWorkspaces] = useState({});
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: "",
    description: "",
    isPublic: false,
    background: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in!");

      const [activeResponse, deletedResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/workspaces", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/workspaces/deleted", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setWorkspaces(activeResponse.data);
      setDeletedWorkspaces(deletedResponse.data);

      const initialOpenState = activeResponse.data.reduce(
        (acc, ws) => ({ ...acc, [ws._id]: true }),
        {}
      );
      setOpenWorkspaces(initialOpenState);

      if (socket && socketReady) {
        activeResponse.data.forEach((ws) => joinWorkspaceRoom(ws._id));
      }
    } catch (error) {
      console.error("[Sidebar] Fetch error:", error.message);
      handleApiError(error, navigate, "Failed to load workspaces!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!socket || !socketReady) return;

    const userId = localStorage.getItem("userId");
    if (userId) socket.emit("join", userId);

    const socketHandlers = {
      "workspace-created": (data) => {
        setWorkspaces((prev) => {
          if (!prev.some((ws) => ws._id === data.workspace._id)) {
            return [...prev, data.workspace];
          }
          return prev;
        });
        setOpenWorkspaces((prev) => ({ ...prev, [data.workspace._id]: true }));
        if (socket && socketReady) joinWorkspaceRoom(data.workspace._id);
      },
      "workspace-updated": (data) => {
        setWorkspaces((prev) =>
          prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
        );
      },
      "workspace-hidden": (data) => {
        const hiddenWorkspace = workspaces.find((ws) => ws._id === data.workspaceId);
        setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
        setDeletedWorkspaces((prev) => {
          if (!prev.some((ws) => ws._id === data.workspaceId)) {
            return [
              ...prev,
              {
                _id: data.workspaceId,
                name: hiddenWorkspace?.name || data.message?.split('"')[1] || "Deleted Workspace",
              },
            ];
          }
          return prev;
        });
        setOpenWorkspaces((prev) => {
          const updated = { ...prev };
          delete updated[data.workspaceId];
          return updated;
        });
        if (selectedWorkspaceId === data.workspaceId) onSelectWorkspace("");
      },
      "workspace-restored": (data) => {
        setDeletedWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
        setWorkspaces((prev) => {
          if (!prev.some((ws) => ws._id === data.workspaceId)) {
            return [...prev, data.workspace];
          }
          return prev;
        });
        setOpenWorkspaces((prev) => ({ ...prev, [data.workspaceId]: true }));
        if (socket && socketReady) joinWorkspaceRoom(data.workspaceId);
      },
      "member-deactivated": (data) => {
        if (
          data.deactivatedUserId === localStorage.getItem("userId") &&
          data.workspaceRemoved
        ) {
          setWorkspaces((prev) =>
            prev.filter((ws) => ws._id !== data.board.workspace._id)
          );
          setOpenWorkspaces((prev) => {
            const updated = { ...prev };
            delete updated[data.board.workspace._id];
            return updated;
          });
          if (selectedWorkspaceId === data.board.workspace._id) onSelectWorkspace("");
        }
      },
      "refresh-sidebar": (data) => {
        if (data.userId === localStorage.getItem("userId")) fetchWorkspaces();
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
      socket.on("workspace-left", socketHandlers["workspace-hidden"]);
    });

    return () => {
      Object.keys(socketHandlers).forEach((event) => {
        socket.off(event, socketHandlers[event]);
        socket.off("workspace-left", socketHandlers["workspace-hidden"]);
      });
    };
  }, [socket, socketReady, selectedWorkspaceId, onSelectWorkspace, workspaces]);

  const handleToggleWorkspace = (workspaceId) => {
    setOpenWorkspaces((prev) => ({ ...prev, [workspaceId]: !prev[workspaceId] }));
  };

  const handleNavigation = (path, workspaceId) => {
    if (path === "boards") {
      onSelectWorkspace(workspaceId);
      navigate(`/workspace/${workspaceId}/boards`);
    } else {
      navigate(`/workspace/${workspaceId}/${path}`);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name.trim()) {
      setError("Tên không gian làm việc không được để trống!");
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in!");

      const response = await axios.post(
        "http://localhost:5000/api/workspaces",
        newWorkspace,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("workspace-created", {
          workspace: response.data,
          message: `Workspace "${response.data.name}" created.`,
        });
      } else {
        setWorkspaces((prev) => [...prev, response.data]);
        setOpenWorkspaces((prev) => ({ ...prev, [response.data._id]: true }));
      }

      setOpenCreateDialog(false);
      setNewWorkspace({ name: "", description: "", isPublic: false, background: "" });
      toast.success("Workspace created successfully!");
    } catch (error) {
      console.error("[Sidebar] Create error:", error.message);
      setError(handleApiError(error, navigate, "Failed to create workspace!"));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId) => {
    const workspace = workspaces.find((ws) => ws._id === workspaceId);
    if (!window.confirm(`Bạn có chắc muốn xóa không gian làm việc này không "${workspace?.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in!");

      await axios.delete(`http://localhost:5000/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (socket && socketReady) {
        socket.emit("workspace-hidden", {
          workspaceId,
          message: `Workspace "${workspace?.name}" deleted.`,
        });
      } else {
        setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));
        if (selectedWorkspaceId === workspaceId) onSelectWorkspace("");
      }

      toast.success("Xóa không gian làm việc thành công!");
    } catch (error) {
      console.error("[Sidebar] Delete error:", error.message);
      handleApiError(error, navigate, "Lỗi khi xóa không gian làm việc!");
    }
  };

  const handleLeaveWorkspace = async (workspaceId) => {
    const workspace = workspaces.find((ws) => ws._id === workspaceId);
    if (!window.confirm(`Bạn có muốn rời khỏi không gian làm việc này không "${workspace?.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in!");

      await axios.post(
        `http://localhost:5000/api/workspaces/${workspaceId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("workspace-left", {
          workspaceId,
          message: `Rời không gian làm việc "${workspace?.name}".`,
        });
      } else {
        setWorkspaces((prev) => prev.filter((ws) => ws._id !== workspaceId));
        if (selectedWorkspaceId === workspaceId) onSelectWorkspace("");
      }

      toast.success("Rời không gian làm việc thành công!");
    } catch (error) {
      console.error("[Sidebar] Leave error:", error.message);
      handleApiError(error, navigate, "Không thể rời không gian làm việc!");
    }
  };

  const getWorkspaceBackground = (workspace, isSelected) => {
    if (workspace.background?.startsWith("http")) {
      return `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${workspace.background}) no-repeat center/cover`;
    }
    return isSelected
      ? isDarkMode
        ? "#667EEA"
        : "#3182CE"
      : isDarkMode
        ? "#2D3748"
        : "#EDF2F7";
  };

  const renderWorkspaceItem = (workspace, index) => {
    const isSelected = selectedWorkspaceId === workspace._id;
    const isOwner = workspace.owner?._id === userId;
    const isExpanded = openWorkspaces[workspace._id];

    return (
      <Fade in key={workspace._id} timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ListItemButton
              onClick={() => {
                handleToggleWorkspace(workspace._id);
                onSelectWorkspace(workspace._id);
              }}
              sx={{
                flex: 1,
                borderRadius: "12px",
                background: getWorkspaceBackground(workspace, isSelected),
                color: workspace.background?.startsWith("http")
                  ? "#ffffff"
                  : isSelected
                    ? "#ffffff"
                    : isDarkMode
                      ? "#E2E8F0"
                      : "#4A5568",
                "&:hover": {
                  bgcolor: isSelected
                    ? isDarkMode
                      ? "#7F9CF5"
                      : "#2B6CB0"
                    : isDarkMode
                      ? "#4A5568"
                      : "#E2E8F0",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease",
                py: 1.5,
                px: 2,
                boxShadow: isSelected
                  ? isDarkMode
                    ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                    : "0 4px 12px rgba(49, 130, 206, 0.3)"
                  : "none",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                <FolderIcon />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "0.95rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {workspace.name}
                    </Typography>
                    {workspace.isPublic && <PublicIcon sx={{ fontSize: 14, opacity: 0.8 }} />}
                    {isOwner && <AccountBoxIcon sx={{ fontSize: 14, opacity: 0.8 }} />}
                  </Box>
                }
              />
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Tooltip title={isOwner ? "Xóa không gian" : "Rời khỏi không gian"}>
              <IconButton
                onClick={() =>
                  isOwner
                    ? handleDeleteWorkspace(workspace._id)
                    : handleLeaveWorkspace(workspace._id)
                }
                sx={{
                  color: isOwner
                    ? isDarkMode
                      ? "#EF4444"
                      : "#DC2626"
                    : isDarkMode
                      ? "#F59E0B"
                      : "#D97706",
                  "&:hover": {
                    bgcolor: isOwner
                      ? isDarkMode
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(220, 38, 38, 0.1)"
                      : isDarkMode
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(217, 119, 6, 0.1)",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease",
                  ml: 0.5,
                }}
                size="small"
              >
                {isOwner ? <DeleteIcon fontSize="small" /> : <ExitToAppIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3, mt: 0.5 }}>
              {[
                { text: "Thành viên", icon: <PeopleIcon />, path: "members" },
                { text: "Chỉnh sửa", icon: <SettingsIcon />, path: "settings" },
              ].map((item) => (
                <ListItemButton
                  key={item.text}
                  onClick={() => handleNavigation(item.path, workspace._id)}
                  sx={{
                    borderRadius: "12px",
                    py: 1,
                    px: 2,
                    mb: 0.5,
                    "&:hover": {
                      bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0",
                      transform: "translateX(4px)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemIcon sx={{ color: isDarkMode ? "#A0AEC0" : "#4A5568", minWidth: 32 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography sx={{ fontSize: "0.9rem", fontWeight: 500 }}>{item.text}</Typography>}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>
      </Fade>
    );
  };

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: isDarkMode ? "#1A202C" : "#F7FAFC",
        color: isDarkMode ? "#E2E8F0" : "#2D3748",
        minHeight: "calc(100vh - 16px)",
        maxHeight: "calc(100vh - 16px)",
        display: "flex",
        flexDirection: "column",
        borderRadius: "16px",
        boxShadow: isDarkMode ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
          bgcolor: isDarkMode ? "#2D3748" : "#ffffff",
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: isDarkMode ? "#E2E8F0" : "#2D3748", mb: 2 }}>
          Không gian làm việc
        </Typography>
        <List sx={{ p: 0 }}>
          <ListItemButton
            onClick={() => navigate("/")}
            sx={{
              borderRadius: "12px",
              "&:hover": {
                bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0",
                transform: "translateY(-1px)",
              },
              transition: "all 0.2s ease",
              py: 1.5,
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>Home</Typography>} />
          </ListItemButton>
        </List>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 3,
          minHeight: 0,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: isDarkMode ? "#667EEA" : "#3182CE",
            borderRadius: "10px",
            "&:hover": {
              background: isDarkMode ? "#7F9CF5" : "#2B6CB0",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, px: 1 }}>
          <Typography variant="overline" sx={{ color: isDarkMode ? "#A0AEC0" : "#718096", fontWeight: 600, letterSpacing: 1 }}>
            Không gian làm việc
          </Typography>
          <Tooltip title="Tạo không gian làm việc">
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateDialog(true)}
              sx={{
                color: isDarkMode ? "#667EEA" : "#3182CE",
                "&:hover": {
                  bgcolor: isDarkMode ? "rgba(102, 126, 234, 0.1)" : "rgba(49, 130, 206, 0.1)",
                  transform: "scale(1.05)",
                },
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8rem",
                transition: "all 0.2s ease",
              }}
            >
              Tạo không gian
            </Button>
          </Tooltip>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress size={32} sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }} />
          </Box>
        ) : workspaces.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 4,
              px: 2,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              borderRadius: "12px",
              border: `2px dashed ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
            }}
          >
            <FolderIcon sx={{ fontSize: 48, color: isDarkMode ? "#4A5568" : "#CBD5E0", mb: 2 }} />
            <Typography sx={{ color: isDarkMode ? "#A0AEC0" : "#718096", fontWeight: 500, mb: 1 }}>
              Chưa có không gian làm việc
            </Typography>
            <Typography sx={{ color: isDarkMode ? "#718096" : "#A0AEC0", fontSize: "0.9rem" }}>
              Tạo không gian làm việc đầu tiên của bạn
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>{workspaces.map((workspace, index) => renderWorkspaceItem(workspace, index))}</List>
        )}
      </Box>

      <Box
        sx={{
          bgcolor: isDarkMode ? "#2D3748" : "#EDF2F7",
          p: 3,
          textAlign: "center",
          borderTop: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
          flexShrink: 0,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: isDarkMode ? "#A0AEC0" : "#4A5568",
            mb: 2,
            lineHeight: 1.4,
          }}
        >
          Upgrade for unlimited boards and advanced features.
        </Typography>
        <Button
          variant="contained"
          startIcon={<UpgradeIcon />}
          fullWidth
          sx={{
            bgcolor: isDarkMode ? "#667EEA" : "#3182CE",
            "&:hover": {
              bgcolor: isDarkMode ? "#7F9CF5" : "#2B6CB0",
              transform: "translateY(-2px)",
            },
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.5,
            boxShadow: isDarkMode
              ? "0 4px 12px rgba(102, 126, 234, 0.3)"
              : "0 4px 12px rgba(49, 130, 206, 0.3)",
            transition: "all 0.2s ease",
          }}
        >
          Upgrade Now
        </Button>
      </Box>

      <Dialog
        open={openCreateDialog}
        onClose={() => {
          setOpenCreateDialog(false);
          setError(null);
          setNewWorkspace({ name: "", description: "", isPublic: false, background: "" });
        }}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "16px",
            bgcolor: isDarkMode ? "#1A202C" : "#ffffff",
            color: isDarkMode ? "#E2E8F0" : "#2D3748",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.25rem",
            borderBottom: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AddIcon sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }} />
          Tạo mới
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.1)",
              }}
            >
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Tên của không gian làm việc"
            fullWidth
            value={newWorkspace.name}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, name: e.target.value })}
            placeholder="Nhập tên"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              },
            }}
          />
          <TextField
            margin="dense"
            label="Mô tả thông tin không gian"
            fullWidth
            multiline
            rows={3}
            value={newWorkspace.description}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, description: e.target.value })}
            placeholder="nhập mô tả"
            sx={{
              mb: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              },
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={newWorkspace.isPublic}
                onChange={(e) => setNewWorkspace({ ...newWorkspace, isPublic: e.target.checked })}
                sx={{
                  color: isDarkMode ? "#667EEA" : "#3182CE",
                  "&.Mui-checked": {
                    color: isDarkMode ? "#667EEA" : "#3182CE",
                  },
                }}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <PublicIcon fontSize="small" />
                <Typography>Public</Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? "#A0AEC0" : "#718096" }}>
                  Tất cả mọi người có thể tham gia
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Ảnh nền"
            fullWidth
            value={newWorkspace.background}
            onChange={(e) => setNewWorkspace({ ...newWorkspace, background: e.target.value })}
            placeholder="https://example.com/image.jpg"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${isDarkMode ? "#4A5568" : "#E2E8F0"}` }}>
          <Button
            onClick={() => {
              setOpenCreateDialog(false);
              setError(null);
              setNewWorkspace({ name: "", description: "", isPublic: false, background: "" });
            }}
            disabled={createLoading}
            sx={{
              color: isDarkMode ? "#A0AEC0" : "#4A5568",
              borderRadius: "12px",
              textTransform: "none",
              px: 3,
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreateWorkspace}
            variant="contained"
            disabled={createLoading || !newWorkspace.name.trim()}
            startIcon={createLoading ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{
              bgcolor: isDarkMode ? "#667EEA" : "#3182CE",
              "&:hover": {
                bgcolor: isDarkMode ? "#7F9CF5" : "#2B6CB0",
              },
              "&:disabled": {
                bgcolor: isDarkMode ? "#4A5568" : "#CBD5E0",
              },
              borderRadius: "12px",
              textTransform: "none",
              px: 3,
              fontWeight: 600,
            }}
          >
            {createLoading ? "Đang tạo..." : "Tạo không gian"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sidebar;
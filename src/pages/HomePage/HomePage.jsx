import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardActions,
  Chip,
  Fade,
  Skeleton,
  Divider,
  Grid,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Public as PublicIcon,
  People as PeopleIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../context/SocketContext";
import Sidebar from "../HomePage/Sidebar/Sidebar";
import BoardList from "../BoardList/BoardList";

const handleApiError = (error, navigate, defaultMessage) => {
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  if (error.response?.status === 401 || error.message.includes("token")) {
    navigate("/login");
  }
  return message;
};

const HomePage = () => {
  const { socket, socketReady, joinWorkspaceRoom } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [publicSearchValue, setPublicSearchValue] = useState("");
  const [boards, setBoards] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [deletedWorkspaces, setDeletedWorkspaces] = useState([]);
  const [publicWorkspaces, setPublicWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedWorkspaceBackground, setSelectedWorkspaceBackground] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);
  const [joiningWorkspaces, setJoiningWorkspaces] = useState(new Set());
  const [workspaceBackgroundErrors, setWorkspaceBackgroundErrors] = useState({});

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

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

      if (socket && socketReady) {
        activeResponse.data.forEach((ws) => joinWorkspaceRoom(ws._id));
      }
    } catch (error) {
      console.error("[fetchWorkspaces] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tải danh sách không gian làm việc!");
    }
  };

  const fetchPublicWorkspaces = async () => {
    try {
      setPublicLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.get(
        `http://localhost:5000/api/workspaces/public${publicSearchValue ? `?search=${publicSearchValue}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPublicWorkspaces(response.data);
      response.data.forEach((workspace) => {
        if (workspace.background) {
          const img = new Image();
          img.src = workspace.background;
          img.onerror = () => setWorkspaceBackgroundErrors((prev) => ({ ...prev, [workspace._id]: true }));
          img.onload = () => setWorkspaceBackgroundErrors((prev) => ({ ...prev, [workspace._id]: false }));
        }
      });
    } catch (error) {
      console.error("[fetchPublicWorkspaces] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tải danh sách không gian công khai!");
    } finally {
      setPublicLoading(false);
    }
  };

  const fetchBoards = async (forceWorkspaceId = null) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.get("http://localhost:5000/api/boards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const workspaceIdToFilter = forceWorkspaceId || selectedWorkspaceId;
      const filteredBoards = workspaceIdToFilter
        ? response.data.boards.filter((board) => board.workspace?._id === workspaceIdToFilter)
        : response.data.boards.filter((board) => board.workspace);

      setBoards(filteredBoards);
    } catch (error) {
      console.error("[fetchBoards] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tải danh sách bảng!");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinWorkspace = async (workspaceId) => {
    setJoiningWorkspaces((prev) => new Set([...prev, workspaceId]));

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");
      if (!workspaceId) throw new Error("Không tìm thấy ID không gian làm việc!");

      const response = await axios.post(
        `http://localhost:5000/api/workspaces/${workspaceId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      setWorkspaces((prev) => {
        if (prev.some((ws) => ws._id === response.data.workspace._id)) return prev;
        return [...prev, response.data.workspace];
      });

      joinWorkspaceRoom(response.data.workspace._id);
      setSelectedWorkspaceId(response.data.workspace._id);
      setSelectedWorkspaceBackground(response.data.workspace.background || null);
      await fetchBoards(response.data.workspace._id);
    } catch (error) {
      console.error("[handleJoinWorkspace] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tham gia không gian làm việc!");
    } finally {
      setJoiningWorkspaces((prev) => {
        const newSet = new Set(prev);
        newSet.delete(workspaceId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    if (!socket || !socketReady) {
      fetchWorkspaces();
      fetchBoards();
      fetchPublicWorkspaces();
      return;
    }

    const userId = localStorage.getItem("userId");
    if (userId) socket.emit("join", userId);

    fetchWorkspaces();
    fetchBoards();
    fetchPublicWorkspaces();

    const socketHandlers = {
      "workspaces-loaded": (workspaceIds) => {
        workspaceIds.forEach((id) => joinWorkspaceRoom(id));
      },
      "workspace-created": (data) => {
        setWorkspaces((prev) => {
          if (prev.some((ws) => ws._id === data.workspace._id)) return prev;
          return [...prev, data.workspace];
        });
        joinWorkspaceRoom(data.workspace._id);
        if (selectedWorkspaceId === data.workspace._id) fetchBoards();
      },
      "workspace-updated": (data) => {
        setWorkspaces((prev) =>
          prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
        );
        if (selectedWorkspaceId === data.workspace._id) {
          setSelectedWorkspaceBackground(data.workspace.background || null);
          fetchBoards();
        }
      },
      "workspace-hidden": (data) => {
        setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
        setDeletedWorkspaces((prev) => {
          if (prev.some((ws) => ws._id === data.workspaceId)) return prev;
          return [...prev, { _id: data.workspaceId, name: data.message.split('"')[1] || "Không gian đã xóa" }];
        });
        if (selectedWorkspaceId === data.workspaceId) {
          setSelectedWorkspaceId("");
          setSelectedWorkspaceBackground(null);
          setBoards([]);
        }
        fetchBoards();
      },
      "workspace-restored": (data) => {
        setDeletedWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspace._id));
        setWorkspaces((prev) => {
          if (prev.some((ws) => ws._id === data.workspace._id)) return prev;
          return [...prev, data.workspace];
        });
        joinWorkspaceRoom(data.workspace._id);
        if (selectedWorkspaceId === data.workspace._id) fetchBoards();
      },
      "workspace-joined": (data) => {
        if (!data.workspace?._id) return;
        setWorkspaces((prev) => {
          if (prev.some((ws) => ws._id === data.workspace._id)) return prev;
          return [...prev, data.workspace];
        });
        joinWorkspaceRoom(data.workspace._id);
        toast.success(data.message);
        if (selectedWorkspaceId === data.workspace._id) fetchBoards();
      },
      "board-created": (data) => {
        if (!selectedWorkspaceId || data.board.workspace?._id === selectedWorkspaceId) {
          setBoards((prev) => {
            if (prev.some((b) => b._id === data.board._id)) return prev;
            return [...prev, data.board];
          });
        }
      },
      "boardUpdated": (data) => {
        if (!selectedWorkspaceId || data.workspace?._id === selectedWorkspaceId) {
          setBoards((prev) => prev.map((b) => (b._id === data._id ? data : b)));
        }
      },
      "board-deleted": (data) => {
        setBoards((prev) => prev.filter((b) => b._id !== data.boardId));
      },
      "member-deactivated": (data) => {
        if (data.deactivatedUserId === localStorage.getItem("userId")) {
          setBoards((prev) => prev.filter((b) => b._id !== data.board._id));
          if (data.workspaceRemoved) {
            setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.board.workspace?._id));
            if (selectedWorkspaceId === data.board.workspace?._id) {
              setSelectedWorkspaceId("");
              setSelectedWorkspaceBackground(null);
              setBoards([]);
            }
          }
        } else {
          setBoards((prev) => prev.map((b) => (b._id === data.board._id ? data.board : b)));
        }
        fetchBoards();
      },
      "refresh-sidebar": (data) => {
        if (data.userId === localStorage.getItem("userId")) {
          fetchWorkspaces();
          fetchBoards();
        }
      },
    };

    Object.entries(socketHandlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => {
      Object.entries(socketHandlers).forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [socket, socketReady, selectedWorkspaceId, publicSearchValue]);

  const handleSelectWorkspace = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    const selectedWorkspace = workspaces.find((ws) => ws._id === workspaceId);
    setSelectedWorkspaceBackground(selectedWorkspace?.background || null);
    setBackgroundError(false);
    fetchBoards(workspaceId);
  };

  const handleCreateBoard = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui lòng chọn một không gian làm việc!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập!");

      const response = await axios.post(
        "http://localhost:5000/api/boards",
        {
          title: `Bảng mới ${boards.length + 1}`,
          description: "Một bảng mới",
          visibility: "private",
          background: isDarkMode ? "#2D3748" : "#EDF2F7",
          workspace: selectedWorkspaceId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("board-created", { board: response.data });
      }
      toast.success("Tạo bảng thành công!");
      fetchBoards();
    } catch (error) {
      console.error("[handleCreateBoard] Lỗi:", error.message);
      handleApiError(error, navigate, "Không thể tạo bảng!");
    }
  };

  const handleUpdateBoard = (updatedBoard) => {
    setBoards((prev) => prev.map((board) => (board._id === updatedBoard._id ? updatedBoard : board)));
  };

  const handleDeleteBoard = (boardId) => {
    setBoards((prev) => prev.filter((board) => board._id !== boardId));
  };

  const handleBackgroundError = () => {
    setBackgroundError(true);
  };

  const renderPublicWorkspaceCard = (workspace) => {
    const isJoined = workspaces.some((ws) => ws._id === workspace._id);
    const isJoining = joiningWorkspaces.has(workspace._id);
    const hasBackgroundError = workspaceBackgroundErrors[workspace._id];

    return (
      <Fade in key={workspace._id}>
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: isDarkMode ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.15)",
            },
            bgcolor: isDarkMode ? "#2D3748" : "#ffffff",
            borderRadius: "16px",
            border: isDarkMode ? "1px solid #4A5568" : "1px solid #E2E8F0",
          }}
        >
          <CardContent
            sx={{
              flexGrow: 1,
              p: 3,
              position: "relative",
              backgroundImage: workspace.background && !hasBackgroundError ? `url(${workspace.background})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              bgcolor: isDarkMode ? "#2D3748" : "#ffffff",
            }}
          >
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, bgcolor: "rgba(0,0,0,0.6)", zIndex: 0 }} />
            {workspace.background && (
              <img
                src={workspace.background}
                alt="Nền không gian làm việc"
                style={{ display: "none" }}
                onError={() => setWorkspaceBackgroundErrors((prev) => ({ ...prev, [workspace._id]: true }))}
              />
            )}
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PublicIcon sx={{ mr: 1, color: isDarkMode ? "#667EEA" : "#3182CE", fontSize: 20 }} />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: "#E2E8F0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {workspace.name}
                </Typography>
                {isJoined && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Đã tham gia"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: "#A0AEC0",
                  mb: 2,
                  minHeight: 40,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {workspace.description || "Không có mô tả"}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PeopleIcon sx={{ mr: 1, color: "#A0AEC0", fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: "#A0AEC0" }}>
                  Chủ sở hữu: {workspace.owner?.fullName || "Không xác định"}
                </Typography>
              </Box>
              {workspace.memberCount && (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#A0AEC0",
                      bgcolor: "rgba(255,255,255,0.1)",
                      px: 1,
                      py: 0.5,
                      borderRadius: "12px",
                    }}
                  >
                    {workspace.memberCount} thành viên
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
          <CardActions sx={{ p: 3, pt: 0 }}>
            <Button
              variant={isJoined ? "outlined" : "contained"}
              fullWidth
              sx={{
                bgcolor: isJoined ? "transparent" : isDarkMode ? "#667EEA" : "#3182CE",
                color: isJoined ? (isDarkMode ? "#667EEA" : "#3182CE") : "white",
                borderColor: isDarkMode ? "#667EEA" : "#3182CE",
                "&:hover": {
                  bgcolor: isJoined
                    ? isDarkMode
                      ? "rgba(102, 126, 234, 0.1)"
                      : "rgba(49, 130, 206, 0.1)"
                    : isDarkMode
                      ? "#7F9CF5"
                      : "#2B6CB0",
                  transform: "translateY(-1px)",
                },
                borderRadius: "12px",
                textTransform: "none",
                py: 1.5,
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
              onClick={() => handleJoinWorkspace(workspace._id)}
              disabled={isJoined || isJoining}
            >
              {isJoining ? <CircularProgress size={20} color="inherit" /> : isJoined ? "Đã tham gia" : "Tham gia"}
            </Button>
          </CardActions>
        </Card>
      </Fade>
    );
  };

  const renderPublicWorkspacesSkeleton = () => (
    <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 2, ...scrollbarStyles }}>
      {[1, 2, 3].map((item) => (
        <Box key={item} sx={{ minWidth: 320, flexShrink: 0 }}>
          <Card sx={{ height: "240px" }}>
            <CardContent>
              <Skeleton variant="rectangular" width="100%" height={140} sx={{ borderRadius: 2, mb: 2 }} />
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="40%" height={16} sx={{ mt: 2 }} />
            </CardContent>
            <CardActions>
              <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 2 }} />
            </CardActions>
          </Card>
        </Box>
      ))}
    </Box>
  );

  const scrollbarStyles = {
    "&::-webkit-scrollbar": { height: "8px" },
    "&::-webkit-scrollbar-track": { background: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)", borderRadius: "10px" },
    "&::-webkit-scrollbar-thumb": { background: isDarkMode ? "#667EEA" : "#3182CE", borderRadius: "10px", "&:hover": { background: isDarkMode ? "#7F9CF5" : "#2B6CB0" } },
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", maxHeight: "100vh", p: { xs: 1, md: 2 }, overflow: "hidden" }}>
      <Box sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0, mr: { md: 3 }, minHeight: "calc(100vh - 16px)", maxHeight: "calc(100vh - 16px)" }}>
        <Sidebar
          onSelectWorkspace={handleSelectWorkspace}
          selectedWorkspaceId={selectedWorkspaceId}
          workspaces={workspaces}
          setWorkspaces={setWorkspaces}
          deletedWorkspaces={deletedWorkspaces}
          setDeletedWorkspaces={setDeletedWorkspaces}
        />
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          bgcolor: isDarkMode ? "#1A202C" : "#F7FAFC",
          borderRadius: "20px",
          boxShadow: isDarkMode ? "0 12px 40px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.08)",
          position: "relative",
          minHeight: "calc(100vh - 16px)",
          maxHeight: "calc(100vh - 16px)",
          overflow: "hidden",
          background: selectedWorkspaceBackground && !backgroundError ? `url(${selectedWorkspaceBackground}) no-repeat center/cover` : isDarkMode ? "#1A202C" : "#F7FAFC",
          transition: "all 0.5s ease",
        }}
      >
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, bgcolor: isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)", borderRadius: "20px", zIndex: 0 }} />
        {selectedWorkspaceBackground && !backgroundError && (
          <img src={selectedWorkspaceBackground} alt="Nền không gian làm việc" style={{ display: "none" }} onError={handleBackgroundError} />
        )}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            bgcolor: isDarkMode ? "rgba(26,32,44,0.95)" : "rgba(255,255,255,0.95)",
            borderRadius: "16px",
            p: { xs: 3, md: 4 },
            height: "100%",
            overflowY: "auto",
            backdropFilter: "blur(10px)",
            ...scrollbarStyles,
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 2, color: isDarkMode ? "#E2E8F0" : "#2D3748", display: "flex", alignItems: "center", gap: 2 }}
            >
              <DashboardIcon sx={{ fontSize: 32, color: isDarkMode ? "#667EEA" : "#3182CE" }} />
              {selectedWorkspaceId ? "Bảng trong không gian làm việc" : "Bảng của tôi"}
            </Typography>
            {selectedWorkspaceId && (
              <Alert
                severity="info"
                sx={{ mb: 2, bgcolor: isDarkMode ? "rgba(102, 126, 234, 0.1)" : "rgba(49, 130, 206, 0.1)", color: isDarkMode ? "#E2E8F0" : "#2D3748" }}
              >
                Đang hiển thị bảng trong workspace: {workspaces.find((ws) => ws._id === selectedWorkspaceId)?.name}
              </Alert>
            )}
          </Box>
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="workspace-select-label">Không gian làm việc</InputLabel>
                  <Select
                    labelId="workspace-select-label"
                    value={selectedWorkspaceId || ""}
                    label="Không gian làm việc"
                    onChange={(e) => handleSelectWorkspace(e.target.value)}
                    sx={{
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
                      color: isDarkMode ? "#E2E8F0" : "#2D3748",
                      borderRadius: "12px",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDarkMode ? "#4A5568" : "#CBD5E0" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDarkMode ? "#A0AEC0" : "#718096" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Tất cả không gian làm việc</em>
                    </MenuItem>
                    {workspaces.map((workspace) => (
                      <MenuItem key={workspace._id} value={workspace._id}>{workspace.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="medium"
                  placeholder="Tìm kiếm bảng..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: isDarkMode ? "#A0AEC0" : "#718096" }} /> }}
                  sx={{
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
                    borderRadius: "12px",
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: isDarkMode ? "#4A5568" : "#CBD5E0" },
                      "&:hover fieldset": { borderColor: isDarkMode ? "#A0AEC0" : "#718096" },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateBoard}
                  disabled={!selectedWorkspaceId}
                  sx={{
                    bgcolor: isDarkMode ? "#667EEA" : "#3182CE",
                    "&:hover": { bgcolor: isDarkMode ? "#7F9CF5" : "#2B6CB0", transform: "translateY(-2px)" },
                    "&:disabled": { bgcolor: isDarkMode ? "#4A5568" : "#CBD5E0" },
                    borderRadius: "12px",
                    textTransform: "none",
                    py: 1.5,
                    fontWeight: 600,
                    boxShadow: isDarkMode ? "0 4px 12px rgba(102, 126, 234, 0.3)" : "0 4px 12px rgba(49, 130, 206, 0.3)",
                  }}
                >
                  Tạo bảng mới
                </Button>
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ mb: 4, bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 600, color: isDarkMode ? "#E2E8F0" : "#2D3748", display: "flex", alignItems: "center", gap: 1 }}
              >
                <PublicIcon sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }} />
                Không gian công khai
              </Typography>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Tìm kiếm không gian công khai..."
                value={publicSearchValue}
                onChange={(e) => setPublicSearchValue(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: isDarkMode ? "#A0AEC0" : "#718096" }} /> }}
                sx={{
                  width: 300,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)",
                  borderRadius: "12px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: isDarkMode ? "#4A5568" : "#CBD5E0" },
                    "&:hover fieldset": { borderColor: isDarkMode ? "#A0AEC0" : "#718096" },
                  },
                }}
              />
            </Box>
            {publicLoading ? (
              renderPublicWorkspacesSkeleton()
            ) : publicWorkspaces.length > 0 ? (
              <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 2, ...scrollbarStyles }}>
                {publicWorkspaces.map((workspace) => (
                  <Box key={workspace._id} sx={{ minWidth: 320, flexShrink: 0 }}>
                    {renderPublicWorkspaceCard(workspace)}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderRadius: "16px",
                  border: `2px dashed ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
                }}
              >
                <PublicIcon sx={{ fontSize: 48, color: isDarkMode ? "#4A5568" : "#CBD5E0", mb: 2 }} />
                <Typography variant="h6" sx={{ color: isDarkMode ? "#A0AEC0" : "#718096", mb: 1 }}>
                  Không tìm thấy không gian công khai
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? "#718096" : "#A0AEC0" }}>
                  Hãy thử tìm kiếm với từ khóa khác
                </Typography>
              </Box>
            )}
          </Box>
          <Divider sx={{ mb: 4, bgcolor: isDarkMode ? "#4A5568" : "#E2E8F0" }} />
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 3, color: isDarkMode ? "#E2E8F0" : "#2D3748", display: "flex", alignItems: "center", gap: 1 }}
            >
              <DashboardIcon sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }} />
              {selectedWorkspaceId ? `Bảng trong "${workspaces.find((ws) => ws._id === selectedWorkspaceId)?.name}"` : "Tất cả bảng của bạn"}
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6, flexGrow: 1, alignItems: "center" }}>
                <CircularProgress size={48} sx={{ color: isDarkMode ? "#667EEA" : "#3182CE" }} />
              </Box>
            ) : boards.length > 0 ? (
              <Box sx={{ display: "flex", gap: 3, overflowX: "auto", pb: 2, ...scrollbarStyles }}>
                <BoardList boards={boards} searchValue={searchValue} onUpdate={handleUpdateBoard} onDelete={handleDeleteBoard} />
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 8,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  borderRadius: "20px",
                  border: `2px dashed ${isDarkMode ? "#4A5568" : "#E2E8F0"}`,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <DashboardIcon sx={{ fontSize: 64, color: isDarkMode ? "#4A5568" : "#CBD5E0", mb: 2 }} />
                <Typography variant="h5" sx={{ color: isDarkMode ? "#A0AEC0" : "#718096", mb: 2, fontWeight: 600 }}>
                  {selectedWorkspaceId ? "Chưa có bảng trong không gian làm việc này" : "Chưa có bảng nào"}
                </Typography>
                <Typography variant="body1" sx={{ color: isDarkMode ? "#718096" : "#A0AEC0", mb: 3 }}>
                  {selectedWorkspaceId ? "Hãy tạo bảng đầu tiên để bắt đầu làm việc" : "Vui lòng chọn một không gian làm việc để xem bảng"}
                </Typography>
                {selectedWorkspaceId && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateBoard}
                    sx={{
                      bgcolor: isDarkMode ? "#667EEA" : "#3182CE",
                      "&:hover": { bgcolor: isDarkMode ? "#7F9CF5" : "#2B6CB0", transform: "translateY(-2px)" },
                      borderRadius: "12px",
                      textTransform: "none",
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      fontSize: "1rem",
                      boxShadow: isDarkMode ? "0 8px 24px rgba(102, 126, 234, 0.3)" : "0 8px 24px rgba(49, 130, 206, 0.3)",
                    }}
                  >
                    Tạo bảng đầu tiên
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
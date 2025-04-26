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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BoardList from "../BoardList/BoardList";
import Sidebar from "./Sidebar/Sidebar";
import axios from "axios";
import { toast } from "react-toastify";
import { SocketContext } from "../../context/SocketContext";

const generateGradient = () => {
  const colors = [
    ["#ff6b6b", "#feca57"],
    ["#6b6bff", "#1dd1a1"],
    ["#0984e3", "#d980fa"],
    ["#ff9ff3", "#feca57"],
    ["#48dbfb", "#1dd1a1"],
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return `linear-gradient(135deg, ${colors[randomIndex][0]}, ${colors[randomIndex][1]})`;
};

const HomePage = () => {
  const { socket, socketReady } = useContext(SocketContext); // Sử dụng socket và socketReady
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const getStoredBgGradient = () =>
    localStorage.getItem("bgGradient") || generateGradient();

  const [searchValue, setSearchValue] = useState("");
  const [bgGradient, setBgGradient] = useState(getStoredBgGradient);
  const [boards, setBoards] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedWorkspaceBackground, setSelectedWorkspaceBackground] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  useEffect(() => {
    localStorage.setItem("bgGradient", bgGradient);
  }, [bgGradient]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWorkspaces(response.data);
    } catch (error) {
      console.error("Lỗi tải workspaces:", error);
      toast.error("Không thể tải danh sách không gian làm việc!");
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/boards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const filteredBoards = selectedWorkspaceId
        ? response.data.boards.filter(
            (board) => board.workspace._id === selectedWorkspaceId
          )
        : response.data.boards;

      setBoards(filteredBoards);
    } catch (error) {
      console.error("Lỗi tải boards:", error);
      toast.error("Không thể tải danh sách bảng!");
      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket || !socketReady) {
      console.warn("Socket not available or not ready in HomePage");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("join", userId);
      console.log("HomePage tham gia phòng socket:", userId);
    }

    fetchWorkspaces();
    fetchBoards();

    const handleWorkspacesLoaded = (workspaceIds) => {
      workspaceIds.forEach((workspaceId) => {
        socket.emit("join", workspaceId);
        console.log("HomePage tham gia phòng workspace:", workspaceId);
      });
    };

    const handleWorkspaceCreated = (data) => {
      console.log("Nhận workspace-created:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
      socket.emit("join", data.workspace._id);
    };

    const handleWorkspaceUpdated = (data) => {
      console.log("Nhận workspace-updated:", data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
      );
      if (selectedWorkspaceId === data.workspace._id) {
        setSelectedWorkspaceBackground(data.workspace.background || null);
      }
    };

    const handleWorkspaceHidden = (data) => {
      console.log("Nhận workspace-hidden:", data);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
      if (selectedWorkspaceId === data.workspaceId) {
        setSelectedWorkspaceId("");
        setSelectedWorkspaceBackground(null);
        setBoards([]);
      }
    };

    const handleBoardCreated = (data) => {
      console.log("Nhận board-created:", data);
      if (
        !selectedWorkspaceId ||
        data.board.workspace._id === selectedWorkspaceId
      ) {
        setBoards((prev) => {
          if (!prev.some((b) => b._id === data.board._id)) {
            return [...prev, data.board];
          }
          return prev;
        });
      }
    };

    const handleBoardUpdated = (data) => {
      console.log("Nhận boardUpdated:", data);
      if (!selectedWorkspaceId || data.workspace?._id === selectedWorkspaceId) {
        setBoards((prev) => prev.map((b) => (b._id === data._id ? data : b)));
      }
    };

    const handleBoardDeleted = (data) => {
      console.log("Nhận board-deleted:", data);
      setBoards((prev) => prev.filter((b) => b._id !== data.boardId));
    };

    const handleMemberDeactivated = (data) => {
      console.log("Nhận member-deactivated:", data);
      if (data.deactivatedUserId === localStorage.getItem("userId")) {
        setBoards((prev) => prev.filter((b) => b._id !== data.board._id));
        if (data.workspaceRemoved) {
          setWorkspaces((prev) =>
            prev.filter((ws) => ws._id !== data.board.workspace._id)
          );
          if (selectedWorkspaceId === data.board.workspace._id) {
            setSelectedWorkspaceId("");
            setSelectedWorkspaceBackground(null);
            setBoards([]);
          }
        }
      } else {
        setBoards((prev) =>
          prev.map((b) => (b._id === data.board._id ? data.board : b))
        );
      }
    };

    const handleRefreshSidebar = (data) => {
      console.log("Nhận refresh-sidebar:", data);
      if (data.userId === localStorage.getItem("userId")) {
        fetchWorkspaces();
      }
    };

    socket.on("workspaces-loaded", handleWorkspacesLoaded);
    socket.on("workspace-created", handleWorkspaceCreated);
    socket.on("workspace-updated", handleWorkspaceUpdated);
    socket.on("workspace-hidden", handleWorkspaceHidden);
    socket.on("board-created", handleBoardCreated);
    socket.on("boardUpdated", handleBoardUpdated);
    socket.on("board-deleted", handleBoardDeleted);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("refresh-sidebar", handleRefreshSidebar);

    return () => {
      socket.off("workspaces-loaded", handleWorkspacesLoaded);
      socket.off("workspace-created", handleWorkspaceCreated);
      socket.off("workspace-updated", handleWorkspaceUpdated);
      socket.off("workspace-hidden", handleWorkspaceHidden);
      socket.off("board-created", handleBoardCreated);
      socket.off("boardUpdated", handleBoardUpdated);
      socket.off("board-deleted", handleBoardDeleted);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("refresh-sidebar", handleRefreshSidebar);
    };
  }, [navigate, selectedWorkspaceId, socket, socketReady]);

  const handleSelectWorkspace = (workspaceId) => {
    setSelectedWorkspaceId(workspaceId);
    const selectedWorkspace = workspaces.find((ws) => ws._id === workspaceId);
    setSelectedWorkspaceBackground(selectedWorkspace?.background || null);
    setBackgroundError(false);
  };

  const handleCreateBoard = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui lòng chọn một không gian làm việc trước!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/boards",
        {
          title: `Bảng mới ${boards.length + 1}`,
          description: "Một bảng mới",
          visibility: "private",
          background: generateGradient(),
          workspace: selectedWorkspaceId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (socket && socketReady) {
        socket.emit("board-created", { board: response.data });
      } else {
        console.warn("Socket not available or not ready for board-created");
      }
      toast.success("Tạo bảng thành công!");
      fetchBoards();
    } catch (error) {
      console.error("Lỗi tạo board:", error);
      toast.error("Có lỗi xảy ra khi tạo bảng!");
    }
  };

  const handleUpdateBoard = (updatedBoard) => {
    setBoards((prevBoards) =>
      prevBoards.map((board) =>
        board._id === updatedBoard._id ? updatedBoard : board
      )
    );
  };

  const handleDeleteBoard = (boardId) => {
    setBoards((prevBoards) =>
      prevBoards.filter((board) => board._id !== boardId)
    );
  };

  const handleBackgroundError = () => {
    setBackgroundError(true);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", p: 1 }}>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "center",
          p: 3,
          background:
            selectedWorkspaceBackground && !backgroundError
              ? `url(${selectedWorkspaceBackground}) no-repeat center/cover`
              : bgGradient,
          transition: "background 1s ease",
          borderRadius: "20px",
          boxShadow: "0px 8px 16px rgba(0,0,0,0.2)",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.4)"
              : "rgba(255, 255, 255, 0.2)",
            borderRadius: "20px",
          }}
        />
        {selectedWorkspaceBackground && !backgroundError && (
          <img
            src={selectedWorkspaceBackground}
            alt="Workspace background"
            style={{ display: "none" }}
            onError={handleBackgroundError}
          />
        )}
        <Box sx={{ width: "250px", flexShrink: 0, mr: 2, zIndex: 1 }}>
          <Sidebar onSelectWorkspace={handleSelectWorkspace} />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            height: "calc(100vh)",
            overflowY: "auto",
            backdropFilter: "blur(5px)",
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(255, 255, 255, 0.7)",
            borderRadius: 4,
            padding: 4,
            boxShadow: isDarkMode
              ? "0px 8px 16px rgba(0, 0, 0, 0.5)"
              : "0px 8px 16px rgba(0, 0, 0, 0.2)",
            transition: "all 0.5s ease",
            zIndex: 1,
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 3, color: isDarkMode ? "#fff" : "#333" }}
          >
            {selectedWorkspaceId ? "Các bảng trong Workspace" : "Bảng của tôi"}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="workspace-select-label">
                Không gian làm việc
              </InputLabel>
              <Select
                labelId="workspace-select-label"
                value={selectedWorkspaceId || ""}
                label="Không gian làm việc"
                onChange={(e) => handleSelectWorkspace(e.target.value)}
                sx={{
                  backgroundColor: isDarkMode
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(255, 255, 255, 0.8)",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                <MenuItem value="">
                  <em>Tất cả không gian làm việc</em>
                </MenuItem>
                {workspaces.map((workspace) => (
                  <MenuItem key={workspace._id} value={workspace._id}>
                    {workspace.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography
              variant="body1"
              sx={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              Chọn màu nền:
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setBgGradient(generateGradient())}
              sx={{
                color: isDarkMode ? "#fff" : "#333",
                borderColor: isDarkMode ? "#fff" : "#333",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
              }}
            >
              Random Gradient
            </Button>
          </Box>
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Tìm kiếm bảng..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    sx={{ mr: 1, color: isDarkMode ? "#ccc" : "gray" }}
                  />
                ),
              }}
              sx={{
                width: "300px",
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(255, 255, 255, 0.8)",
                borderRadius: 2,
                color: isDarkMode ? "#fff" : "#000",
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBoard}
              sx={{
                bgcolor: isDarkMode ? "#673ab7" : "primary.main",
                color: "white",
                transition: "0.3s",
                "&:hover": {
                  bgcolor: isDarkMode ? "#512da8" : "secondary.main",
                  transform: "scale(1.05)",
                },
              }}
            >
              Tạo bảng
            </Button>
          </Box>
          {selectedWorkspaceId || !selectedWorkspaceId ? (
            loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                <CircularProgress size={50} />
              </Box>
            ) : (
              <BoardList
                boards={boards}
                searchValue={searchValue}
                onUpdate={handleUpdateBoard}
                onDelete={handleDeleteBoard}
              />
            )
          ) : (
            <Typography
              variant="h6"
              sx={{
                textAlign: "center",
                mt: 5,
                color: isDarkMode ? "#ccc" : "gray",
              }}
            >
              Vui lòng chọn một không gian làm việc để xem danh sách bảng.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;

import React, { useState, useEffect, useContext } from "react";
import {
  Button,
  Menu,
  MenuItem,
  Box,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  IconButton,
  ListSubheader,
  CircularProgress,
  useTheme,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Check from "@mui/icons-material/Check";
import RestoreIcon from "@mui/icons-material/Restore";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../../../context/SocketContext";

const handleApiError = (error, navigate, defaultMessage) => {
  console.error("API Error:", error);
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  if (error.response?.status === 401 || error.message.includes("token")) {
    navigate("/login");
  }
  return message;
};

function WorkspaceHistory() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { socket, socketReady } = useContext(SocketContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeWorkspaces, setActiveWorkspaces] = useState([]);
  const [deletedWorkspaces, setDeletedWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);
  const token = localStorage.getItem("token");

  const fetchWorkspaces = async () => {
    if (!token) {
      toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeRes = await axios.get("http://localhost:5000/api/workspaces", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activeData = Array.isArray(activeRes.data) ? activeRes.data : [];
      setActiveWorkspaces(activeData);

      const deletedRes = await axios.get("http://localhost:5000/api/workspaces/deleted", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const deletedData = Array.isArray(deletedRes.data) ? deletedRes.data : [];
      setDeletedWorkspaces(deletedData);

      if (activeData.length === 0 && deletedData.length === 0) {
        toast.info("Không có workspace nào tồn tại. Hãy tạo mới!");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, navigate, "Lỗi tải dữ liệu workspace!");
      setError(errorMessage);
      setActiveWorkspaces([]);
      setDeletedWorkspaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [navigate]);

  useEffect(() => {
    if (open) {
      fetchWorkspaces();
    }
  }, [open]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery("");
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const restoreWorkspace = async (id) => {
    try {
      console.log("Attempting to restore workspace:", id);
      const response = await axios.post(
        `http://localhost:5000/api/workspaces/${id}/restore`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Đã khôi phục workspace!");
      if (socket && socketReady) {
        const userId = localStorage.getItem("userId");
        socket.emit("workspace-restored", {
          workspaceId: id,
          userId: userId,
          workspace: response.data.workspace,
        });
      }

      await fetchWorkspaces();
    } catch (error) {
      console.error("Restore workspace error:", error);
      handleApiError(error, navigate, "Lỗi khôi phục workspace!");
    }
  };

  const filteredActive = Array.isArray(activeWorkspaces)
    ? activeWorkspaces.filter((ws) =>
      ws?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false
    )
    : [];

  const filteredDeleted = Array.isArray(deletedWorkspaces)
    ? deletedWorkspaces.filter((ws) =>
      ws?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false
    )
    : [];

  return (
    <Box>
      <Button
        id="basic-button-workspace-history"
        aria-controls={open ? "basic-menu-workspace-history" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          color: "white",
          fontWeight: 500,
          textTransform: "none",
          borderRadius: 8,
          padding: { xs: "4px 8px", sm: "6px 16px" },
          bgcolor: "rgba(255, 255, 255, 0.1)",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.2)",
            transform: "translateY(-2px)",
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`,
          },
          transition: "all 0.3s ease",
        }}
        endIcon={<ExpandMoreIcon />}
      >
        Workspace History
      </Button>
      <Menu
        id="basic-menu-workspace-history"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button-workspace-history",
        }}
        PaperProps={{
          sx: {
            minWidth: 300,
            maxWidth: 400,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 12,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: theme.palette.primary.main,
              borderRadius: 3,
            },
          },
        }}
      >
        <MenuItem disableRipple sx={{ p: 1.5 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={handleSearch}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            inputProps={{
              onKeyDown: (e) => e.stopPropagation(),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 8,
                bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.4)",
                "&:hover fieldset": { borderColor: theme.palette.primary.light },
                "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
              },
            }}
          />
        </MenuItem>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <ListSubheader sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Active Workspaces
        </ListSubheader>
        {loading ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          </MenuItem>
        ) : error ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="error">
              Error: {error}
            </Typography>
          </MenuItem>
        ) : filteredActive.length > 0 ? (
          filteredActive.map((ws) => (
            <MenuItem
              key={ws._id}
              onClick={() => navigate(`/workspace/${ws._id}`)}
              sx={{
                borderRadius: 8,
                mx: 1,
                my: 0.5,
                "&:hover": {
                  bgcolor: theme.palette.action.selected,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <ListItemText
                primary={ws.name || "No Name"}
                secondary={ws.description || "No Description"}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondaryTypographyProps={{ color: "text.secondary" }}
              />
              {ws.isPublic && (
                <ListItemIcon>
                  <Check sx={{ color: theme.palette.success.main }} />
                </ListItemIcon>
              )}
            </MenuItem>
          ))
        ) : (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No active workspaces found
            </Typography>
          </MenuItem>
        )}
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <ListSubheader sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
          Deleted Workspaces
        </ListSubheader>
        {loading ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading...</Typography>
            </Box>
          </MenuItem>
        ) : error ? (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="error">
              Error: {error}
            </Typography>
          </MenuItem>
        ) : filteredDeleted.length > 0 ? (
          filteredDeleted.map((ws) => (
            <MenuItem
              key={ws._id}
              sx={{
                borderRadius: 8,
                mx: 1,
                my: 0.5,
                "&:hover": {
                  bgcolor: theme.palette.action.selected,
                  transform: "translateY(-1px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              <ListItemText
                primary={ws.name || "No Name"}
                secondary={ws.description || "No Description"}
                primaryTypographyProps={{ fontWeight: 500 }}
                secondaryTypographyProps={{ color: "text.secondary" }}
              />
              <ListItemIcon>
                <IconButton
                  onClick={() => restoreWorkspace(ws._id)}
                  sx={{
                    color: theme.palette.primary.main,
                    "&:hover": {
                      bgcolor: theme.palette.primary.light + "20",
                    },
                  }}
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </ListItemIcon>
            </MenuItem>
          ))
        ) : (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No deleted workspaces found
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default WorkspaceHistory;
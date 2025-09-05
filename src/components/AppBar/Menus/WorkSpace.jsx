
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Button,
  useTheme,
  Typography,
  Divider,
  ListItemText,
} from "@mui/material";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import axios from "axios";
import { SocketContext } from "../../../context/SocketContext";
import { toast } from "react-toastify";

function WorkSpace({ onCreateWorkspace }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { socket, socketReady } = useContext(SocketContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }
      const response = await axios.get("http://localhost:5000/api/workspaces", {
        headers: { Authorization: `Bearer ${token} ` },
        timeout: 5000,
      });
      console.log("Fetched workspaces:", response.data);
      setWorkspaces(response.data);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      toast.error(
        error.message || "Không thể tải danh sách không gian làm việc!"
      );
      if (error.message.includes("token")) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (!socket || !socketReady) {
      console.log("Socket not available or not ready in WorkSpace");
      return;
    }

    socket.on("workspace-created", (data) => {
      console.log("Received workspace-created:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
      toast.info(`Không gian làm việc mới: ${data.workspace.name} `);
    });

    socket.on("workspace-updated", (data) => {
      console.log("Received workspace-updated:", data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
      );
      toast.info(`Không gian làm việc ${data.workspace.name} đã được cập nhật`);
    });

    socket.on("workspace-hidden", (data) => {
      console.log("Received workspace-hidden:", data);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
      toast.info(`Không gian làm việc ${data.workspaceId} đã bị ẩn`);
    });

    socket.on("workspace-restored", (data) => {
      console.log("Received workspace-restored:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
      toast.info(`Không gian làm việc ${data.workspace.name} đã được khôi phục`);
    });

    return () => {
      socket.off("workspace-created");
      socket.off("workspace-updated");
      socket.off("workspace-hidden");
      socket.off("workspace-restored");
    };
  }, [socket, socketReady]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/ workspace / ${workspaceId} `);
    handleClose();
  };

  return (
    <div>
      <Button
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
        startIcon={<WorkspacesIcon />}
        onClick={handleClick}
      >
        Workspaces
      </Button>
      <Menu
        id="workspace-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        PaperProps={{
          sx: {
            minWidth: 240,
            maxWidth: 320,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 12,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"} `,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"} `,
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
        <MenuItem
          onClick={onCreateWorkspace}
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            "&:hover": {
              bgcolor: theme.palette.primary.dark,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            Create New Workspace
          </Typography>
        </MenuItem>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <MenuItem
              key={workspace._id}
              onClick={() => handleWorkspaceClick(workspace._id)}
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
                primary={workspace.name || "No Name"}
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem sx={{ justifyContent: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No workspaces available
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}

export default WorkSpace;

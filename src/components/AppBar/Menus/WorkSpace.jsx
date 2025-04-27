import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import axios from "axios";
import { SocketContext } from "../../../context/SocketContext";
import { toast } from "react-toastify";

const WorkSpace = () => {
  const { socket, socketReady, userId } = useContext(SocketContext);
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000, // Thêm timeout để tránh chờ quá lâu
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

  // Lắng nghe các sự kiện Socket.IO
  useEffect(() => {
    if (!socket || !socketReady) {
      console.log("Socket not available or not ready in WorkSpace");
      return;
    }

    // Khi workspace được tạo
    socket.on("workspace-created", (data) => {
      console.log("Received workspace-created:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
      toast.info(`Không gian làm việc mới: ${data.workspace.name}`);
    });

    // Khi workspace được cập nhật
    socket.on("workspace-updated", (data) => {
      console.log("Received workspace-updated:", data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
      );
      toast.info(`Không gian làm việc ${data.workspace.name} đã được cập nhật`);
    });

    // Khi workspace bị ẩn
    socket.on("workspace-hidden", (data) => {
      console.log("Received workspace-hidden:", data);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
      toast.info(`Không gian làm việc ${data.workspaceId} đã bị ẩn`);
    });

    // Dọn dẹp khi component unmount
    return () => {
      socket.off("workspace-created");
      socket.off("workspace-updated");
      socket.off("workspace-hidden");
    };
  }, [socket, socketReady]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleWorkspaceClick = (workspaceId) => {
    navigate(`/workspace/${workspaceId}`);
    handleClose();
  };

  return (
    <div>
      <Button
        sx={{
          color: "white",
          fontWeight: "bold",
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
      >
        {workspaces.length > 0 ? (
          workspaces.map((workspace) => (
            <MenuItem
              key={workspace._id}
              onClick={() => handleWorkspaceClick(workspace._id)}
            >
              {workspace.name}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>Không có không gian làm việc</MenuItem>
        )}
      </Menu>
    </div>
  );
};

export default WorkSpace;

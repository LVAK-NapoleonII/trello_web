import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import axios from "axios";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const WorkSpace = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token!");
      }
      const response = await axios.get("http://localhost:5000/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched workspaces:", response.data);
      setWorkspaces(response.data);
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      alert("Không thể tải danh sách không gian làm việc!");
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Lắng nghe các sự kiện Socket.IO
  useEffect(() => {
    // Khi workspace được tạo
    socket.on("workspace-created", (data) => {
      console.log("Received workspace-created:", data);
      setWorkspaces((prev) => {
        if (!prev.some((ws) => ws._id === data.workspace._id)) {
          return [...prev, data.workspace];
        }
        return prev;
      });
    });

    // Khi workspace được cập nhật
    socket.on("workspace-updated", (data) => {
      console.log("Received workspace-updated:", data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === data.workspace._id ? data.workspace : ws))
      );
    });

    // Khi workspace bị ẩn
    socket.on("workspace-hidden", (data) => {
      console.log("Received workspace-hidden:", data);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== data.workspaceId));
    });

    // Dọn dẹp khi component unmount
    return () => {
      socket.off("workspace-created");
      socket.off("workspace-updated");
      socket.off("workspace-hidden");
    };
  }, []);

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

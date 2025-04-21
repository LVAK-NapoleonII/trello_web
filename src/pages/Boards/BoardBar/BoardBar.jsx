import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import axios from "axios";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BoardBarChips from "./BoardBarChips";
import BoardBarActions from "./BoardBarActions";
import MemberMenu from "./MemberMenu";
import InviteDialog from "./InviteDialog";
import ManageMembersDialog from "./ManageMembersDialog";
import { SocketContext } from "../../../context/SocketContext";

function BoardBar({ board, setBoard }) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const { socket, socketReady } = useContext(SocketContext);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [openManageMembersDialog, setOpenManageMembersDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  // Kiểm tra setBoard
  useEffect(() => {
    if (typeof setBoard !== "function") {
      console.warn("BoardBar: setBoard is not a function:", setBoard);
      toast.error("Lỗi cấu hình component: setBoard không hợp lệ!");
    }
  }, [setBoard]);

  // Log props để debug
  useEffect(() => {
    console.log("BoardBar props:", { board, setBoard });
    if (!board?._id) {
      console.warn("BoardBar: board._id không hợp lệ hoặc board là null");
      toast.error("Không thể tải dữ liệu bảng!");
    }
  }, [board]);

  // Tham gia phòng socket khi socket sẵn sàng
  useEffect(() => {
    if (!socket || !socketReady || !board?._id) return;

    socket.on("connect", () => {
      console.log("BoardBar: Socket connected, ID:", socket.id);
      socket.emit("join-board", { boardId: board._id });
      console.log("BoardBar: Joined board room:", board._id);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket, socketReady, board?._id]);

  // Socket.IO listeners
  useEffect(() => {
    if (!socket || !socketReady) return;

    socket.on("member-invited", (data) => {
      console.log("BoardBar: Received member-invited:", data);
      if (typeof setBoard === "function") {
        setBoard(data.board);
        toast.success(`Đã mời ${data.invitedUser.fullName} thành công!`);
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
      // Phát sự kiện board-updated để đồng bộ
      socket.emit("board-updated", { board: data.board });
    });

    socket.on("member-deactivated", (data) => {
      console.log("BoardBar: Received member-deactivated:", data);
      if (typeof setBoard === "function") {
        setBoard(data.board);
        toast.success("Đã xóa thành viên thành công!");
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
      if (data.deactivatedUserId === currentUserId) {
        navigate("/boards");
        socket.emit("refresh-sidebar", { userId: currentUserId });
      }
      // Phát sự kiện board-updated để đồng bộ
      socket.emit("board-updated", { board: data.board });
    });

    socket.on("board-updated", (data) => {
      console.log("BoardBar: Received board-updated:", data);
      if (typeof setBoard === "function") {
        setBoard((prev) => {
          const updatedBoard = JSON.parse(JSON.stringify(data.board));
          console.log("Cập nhật board:", updatedBoard);
          return updatedBoard;
        });
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
    });

    socket.on("board-deleted", (data) => {
      console.log("BoardBar: Received board-deleted:", data);
      if (data.boardId === board?._id) {
        toast.error(`Bảng "${board?.title}" đã bị ẩn!`);
        navigate("/boards");
        socket.emit("refresh-sidebar", { userId: currentUserId });
      }
    });

    return () => {
      socket.off("member-invited");
      socket.off("member-deactivated");
      socket.off("board-updated");
      socket.off("board-deleted");
    };
  }, [socket, socketReady, board?._id, setBoard, currentUserId, navigate]);

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoadingUser(true);
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Không tìm thấy token!");
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("BoardBar: Fetched user:", response.data.user);
        setCurrentUserId(response.data.user.id || response.data.user._id);
      } catch (err) {
        console.error(
          "BoardBar: Error fetching current user:",
          err.response?.data || err
        );
        toast.error("Không thể lấy thông tin người dùng hiện tại.");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Tái tính toán activeMembers và pastMembersAndInvited
  const activeMembers = useMemo(
    () => (board?.members || []).filter((member) => member.isActive),
    [board?.members]
  );

  const pastMembersAndInvited = useMemo(
    () => [
      ...(board?.invitedUsers || []).filter(
        (user) =>
          !board?.members?.some(
            (member) => member.user?._id === user.user?._id && member.isActive
          )
      ),
      ...(board?.members || [])
        .filter((member) => !member.isActive)
        .map((member) => ({ user: member.user, isActive: false })),
    ],
    [board?.members, board?.invitedUsers]
  );

  // Fetch board dự phòng
  const fetchBoard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/boards/${board._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (typeof setBoard === "function") {
        setBoard(response.data);
        console.log("BoardBar: Fetched updated board:", response.data);
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
    } catch (err) {
      console.error("BoardBar: Error fetching board:", err);
      toast.error("Không thể cập nhật dữ liệu bảng!");
    }
  };

  // Tìm kiếm người dùng
  const searchUsers = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        console.log("BoardBar: Searching users:", {
          query,
          boardId: board?._id,
        });
        const response = await axios.get(
          `http://localhost:5000/api/auth/search?query=${encodeURIComponent(
            query
          )}&boardId=${board?._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("BoardBar: Search response:", response.data);
        const filteredResults = response.data.users
          .filter(
            (user) =>
              !board?.members?.some(
                (m) => m.user?._id === user._id && m.isActive
              )
          )
          .map((user) => ({
            ...user,
            isPastMember: board?.members?.some(
              (m) => m.user?._id === user._id && !m.isActive
            ),
            isInvited: board?.invitedUsers?.some(
              (i) => i.user?._id === user._id && i.isActive
            ),
          }));
        setSearchResults(filteredResults);
      } catch (err) {
        console.error(
          "BoardBar: Error searching users:",
          err.response?.data || err
        );
        toast.error(
          err.response?.data?.message || "Không thể tìm kiếm người dùng."
        );
      } finally {
        setLoading(false);
      }
    }, 500),
    [board?._id, board?.members, board?.invitedUsers]
  );

  // Mời thành viên
  const handleInviteMember = async () => {
    if (!selectedUserId && !searchQuery.trim()) {
      toast.error("Vui lòng chọn một người dùng hoặc nhập email!");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const payload = selectedUserId
        ? { userId: selectedUserId }
        : { email: searchQuery.trim() };
      console.log("BoardBar: Inviting member:", {
        boardId: board?._id,
        payload,
      });
      const response = await axios.post(
        `http://localhost:5000/api/boards/${board?._id}/invite`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("BoardBar: Invite response:", response.data);
      if (typeof setBoard === "function") {
        setBoard(response.data.board);
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
      if (selectedUserId && socket && socketReady) {
        socket.emit("member-invited", {
          board: response.data.board,
          invitedUser: response.data.board.members.find(
            (m) => m.user._id === selectedUserId
          ).user,
        });
      }
      toast.success(response.data.message);
      setSearchQuery("");
      setSelectedUserId(null);
      setSearchResults([]);
      fetchBoard(); // Dự phòng
    } catch (err) {
      console.error("BoardBar: Error inviting member:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi mời thành viên."
      );
    } finally {
      setLoading(false);
    }
  };

  // Xóa thành viên
  const handleRemoveMember = async (userId) => {
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi bảng?")
    ) {
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      console.log("BoardBar: Removing member:", {
        boardId: board?._id,
        userId,
      });
      const response = await axios.delete(
        `http://localhost:5000/api/boards/${board?._id}/members/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("BoardBar: Remove response:", response.data);
      if (typeof setBoard === "function") {
        setBoard(response.data.board);
      } else {
        console.warn(
          "BoardBar: setBoard is not a function, skipping state update"
        );
      }
      if (socket && socketReady) {
        socket.emit("member-deactivated", {
          board: response.data.board,
          deactivatedUserId: userId,
        });
        socket.emit("refresh-sidebar", { userId });
      }
      toast.success("Đã xóa thành viên thành công!");
      handleCloseMenu();
      fetchBoard(); // Dự phòng
    } catch (err) {
      console.error("BoardBar: Error removing member:", err);
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xóa thành viên."
      );
    } finally {
      setLoading(false);
    }
  };

  // Rời bảng
  const handleLeaveBoard = async () => {
    if (!window.confirm("Bạn có chắc muốn rời khỏi bảng này?")) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token!");
      if (!board?._id) throw new Error("Không tìm thấy board ID!");
      console.log("BoardBar: Leaving board:", {
        boardId: board._id,
        userId: currentUserId,
      });
      const response = await axios.delete(
        `http://localhost:5000/api/boards/${board._id}/leave`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("BoardBar: Leave response:", response.data);
      if (socket && socketReady) {
        socket.emit("member-deactivated", {
          board: response.data.board,
          deactivatedUserId: currentUserId,
          workspaceRemoved: response.data.workspaceRemoved,
        });
      }
      handleCloseManageMembersDialog();
      navigate(response.data.redirect || "/boards");
      toast.success("Đã rời khỏi bảng!");
    } catch (err) {
      console.error(
        "BoardBar: Error leaving board:",
        err.response?.data || err
      );
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi rời bảng.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm tự động
  useEffect(() => {
    if (board?._id) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers, board?._id]);

  // Mở/đóng dialog
  const handleOpenInviteDialog = () => {
    if (!board?._id) {
      toast.error("Không tìm thấy ID của bảng!");
      return;
    }
    setOpenInviteDialog(true);
  };

  const handleCloseInviteDialog = () => {
    setOpenInviteDialog(false);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUserId(null);
  };

  const handleOpenManageMembersDialog = () => {
    setOpenManageMembersDialog(true);
  };

  const handleCloseManageMembersDialog = () => {
    setOpenManageMembersDialog(false);
  };

  // Menu
  const handleOpenMenu = (event, member) => {
    if (event.currentTarget) {
      setAnchorEl(event.currentTarget);
      setSelectedMember(member);
    } else {
      console.warn("BoardBar: Invalid anchorEl in handleOpenMenu");
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  // Các tính năng placeholder
  const handleAddToGoogleDrive = () => {
    toast.info("Tính năng Add to Google Drive đang được phát triển!");
  };

  const handleAutomation = () => {
    toast.info("Tính năng Automation đang được phát triển!");
  };

  const handleFilters = () => {
    toast.info("Tính năng Filters đang được phát triển!");
  };

  // Kiểm tra quyền sở hữu
  const isOwner = useMemo(() => {
    if (loadingUser || !currentUserId || !board?.owner) {
      console.log("BoardBar: isOwner check skipped:", {
        loadingUser,
        currentUserId,
        owner: board?.owner,
      });
      return false;
    }
    const ownerId = board.owner._id
      ? board.owner._id.toString()
      : board.owner.toString();
    console.log("BoardBar: isOwner check:", { currentUserId, ownerId });
    return currentUserId === ownerId;
  }, [loadingUser, currentUserId, board?.owner]);

  // Xử lý trường hợp board là null hoặc đang tải
  if (!board) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
      />
      <Box
        sx={{
          width: "100%",
          height: (theme) => theme.trelloCustom.boarBarHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1, sm: 2 },
          py: 0.5,
          bgcolor: isDarkMode
            ? theme.palette.background.default
            : theme.palette.grey[100],
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <BoardBarChips
          board={board}
          handleAddToGoogleDrive={handleAddToGoogleDrive}
          handleAutomation={handleAutomation}
          handleFilters={handleFilters}
        />
        <BoardBarActions
          activeMembers={activeMembers}
          loading={loading}
          isOwner={isOwner}
          handleOpenInviteDialog={handleOpenInviteDialog}
          handleOpenManageMembersDialog={handleOpenManageMembersDialog}
          handleOpenMenu={handleOpenMenu}
        />
      </Box>

      <MemberMenu
        anchorEl={anchorEl}
        selectedMember={selectedMember}
        isOwner={isOwner}
        board={board}
        handleCloseMenu={handleCloseMenu}
        handleRemoveMember={handleRemoveMember}
      />

      <InviteDialog
        open={openInviteDialog}
        board={board}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        pastMembersAndInvited={pastMembersAndInvited}
        loading={loading}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        handleCloseInviteDialog={handleCloseInviteDialog}
        handleInviteMember={handleInviteMember}
      />

      <ManageMembersDialog
        open={openManageMembersDialog}
        board={board}
        activeMembers={activeMembers}
        isOwner={isOwner}
        loading={loading}
        handleCloseManageMembersDialog={handleCloseManageMembersDialog}
        handleRemoveMember={handleRemoveMember}
        handleLeaveBoard={handleLeaveBoard}
      />
    </>
  );
}

export default BoardBar;

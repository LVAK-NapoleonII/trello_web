import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { Box, CircularProgress, useTheme } from "@mui/material";
import axios from "axios";
import debounce from "lodash/debounce";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PropTypes from "prop-types";
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

  const log = (message, data) => {
    if (process.env.NODE_ENV === "development") {
      console.log(message, data);
    }
  };

  useEffect(() => {
    if (typeof setBoard !== "function") {
      log("BoardBar: setBoard is not a function:", setBoard);
      toast.error("Lỗi cấu hình component: setBoard không hợp lệ!");
    }
  }, [setBoard]);

  useEffect(() => {
    log("BoardBar props:", { board, setBoard });
    if (!board?._id) {
      log("BoardBar: board._id không hợp lệ hoặc board là null");
      toast.error("Không thể tải dữ liệu bảng!");
    }
  }, [board]);

  useEffect(() => {
    if (!socket || !socketReady || !board?._id) return;

    const handleConnect = () => {
      log("BoardBar: Socket connected, ID:", socket.id);
      socket.emit("join-board", { boardId: board._id });
      log("BoardBar: Joined board room:", board._id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, socketReady, board?._id]);

  useEffect(() => {
    if (!socket || !socketReady) return;

    const handleMemberInvited = (data) => {
      log("BoardBar: Received member-invited:", data);
      if (typeof setBoard === "function") {
        setBoard(data.board);
        toast.success(`Đã mời ${data.invitedUser.fullName} thành công!`);
        socket.emit("board-updated", { board: data.board });
      }
    };

    const handleMemberDeactivated = (data) => {
      log("BoardBar: Received member-deactivated:", data);
      if (typeof setBoard === "function") {
        setBoard(data.board);
        toast.success("Đã xóa thành viên thành công!");
      }
      if (data.deactivatedUserId === currentUserId) {
        navigate("/boards");
        socket.emit("refresh-sidebar", { userId: currentUserId });
      }
      socket.emit("board-updated", { board: data.board });
    };

    const handleBoardUpdated = (data) => {
      log("BoardBar: Received board-updated:", data);
      if (typeof setBoard === "function") {
        setBoard((prev) => JSON.parse(JSON.stringify(data.board)));
      }
    };

    const handleBoardDeleted = (data) => {
      log("BoardBar: Received board-deleted:", data);
      if (data.boardId === board?._id) {
        toast.error(`Bảng "${board?.title}" đã bị ẩn!`);
        navigate("/boards");
        socket.emit("refresh-sidebar", { userId: currentUserId });
      }
    };

    socket.on("member-invited", handleMemberInvited);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("board-updated", handleBoardUpdated);
    socket.on("board-deleted", handleBoardDeleted);

    return () => {
      socket.off("member-invited", handleMemberInvited);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("board-updated", handleBoardUpdated);
      socket.off("board-deleted", handleBoardDeleted);
    };
  }, [socket, socketReady, board?._id, setBoard, currentUserId, navigate]);

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
        log("BoardBar: Fetched user:", response.data.user);
        setCurrentUserId(response.data.user.id || response.data.user._id);
      } catch (err) {
        log(
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

  const fetchBoard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/boards/${board._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (typeof setBoard === "function") {
        setBoard(response.data);
        log("BoardBar: Fetched updated board:", response.data);
      }
    } catch (err) {
      log("BoardBar: Error fetching board:", err);
      toast.error("Không thể cập nhật dữ liệu bảng!");
    }
  };

  const searchUsers = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        log("BoardBar: Searching users:", { query, boardId: board?._id });
        const response = await axios.get(
          `http://localhost:5000/api/auth/search?query=${encodeURIComponent(
            query
          )}&boardId=${board?._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        log("BoardBar: Search response:", response.data);
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
        log("BoardBar: Error searching users:", err.response?.data || err);
        toast.error(
          err.response?.data?.message || "Không thể tìm kiếm người dùng."
        );
      } finally {
        setLoading(false);
      }
    }, 500),
    [board?._id, board?.members, board?.invitedUsers]
  );

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
      log("BoardBar: Inviting member:", { boardId: board?._id, payload });
      const response = await axios.post(
        `http://localhost:5000/api/boards/${board?._id}/invite`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      log("BoardBar: Invite response:", response.data);
      if (typeof setBoard === "function") {
        setBoard(response.data.board);
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
      fetchBoard();
    } catch (err) {
      log("BoardBar: Error inviting member:", {
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

  const handleRemoveMember = async (userId) => {
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi bảng?")
    ) {
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      log("BoardBar: Removing member:", { boardId: board?._id, userId });
      const response = await axios.delete(
        `http://localhost:5000/api/boards/${board?._id}/members/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      log("BoardBar: Remove response:", response.data);
      if (typeof setBoard === "function") {
        setBoard(response.data.board);
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
      fetchBoard();
    } catch (err) {
      log("BoardBar: Error removing member:", err);
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xóa thành viên."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveBoard = async () => {
    if (!window.confirm("Bạn có chắc muốn rời khỏi bảng này?")) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token!");
      if (!board?._id) throw new Error("Không tìm thấy board ID!");
      log("BoardBar: Leaving board:", {
        boardId: board._id,
        userId: currentUserId,
      });
      const response = await axios.delete(
        `http://localhost:5000/api/boards/${board._id}/leave`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      log("BoardBar: Leave response:", response.data);
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
      log("BoardBar: Error leaving board:", err.response?.data || err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi rời bảng.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (board?._id) {
      searchUsers(searchQuery);
    }
  }, [searchQuery, searchUsers, board?._id]);

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

  const handleOpenMenu = (event, member) => {
    if (event.currentTarget) {
      setAnchorEl(event.currentTarget);
      setSelectedMember(member);
    } else {
      log("BoardBar: Invalid anchorEl in handleOpenMenu");
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleAddToGoogleDrive = () => {
    toast.info("Tính năng Add to Google Drive đang được phát triển!");
  };

  const handleAutomation = () => {
    toast.info("Tính năng Automation đang được phát triển!");
  };

  const handleFilters = () => {
    toast.info("Tính năng Filters đang được phát triển!");
  };

  const isOwner = useMemo(() => {
    if (loadingUser || !currentUserId || !board?.owner) {
      log("BoardBar: isOwner check skipped:", {
        loadingUser,
        currentUserId,
        owner: board?.owner,
      });
      return false;
    }
    const ownerId = board.owner._id
      ? board.owner._id.toString()
      : board.owner.toString();
    log("BoardBar: isOwner check:", { currentUserId, ownerId });
    return currentUserId === ownerId;
  }, [loadingUser, currentUserId, board?.owner]);

  if (!board || !board._id) {
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

BoardBar.propTypes = {
  board: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    members: PropTypes.arrayOf(
      PropTypes.shape({
        user: PropTypes.shape({
          _id: PropTypes.string,
          fullName: PropTypes.string,
          email: PropTypes.string,
        }),
        isActive: PropTypes.bool,
      })
    ),
    invitedUsers: PropTypes.array,
    owner: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string }),
    ]),
  }).isRequired,
  setBoard: PropTypes.func.isRequired,
};

export default BoardBar;

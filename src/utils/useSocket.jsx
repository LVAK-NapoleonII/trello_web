import { useEffect, useState, useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import axios from "axios";
import { toast } from "react-toastify";

const useSocket = (boardId) => {
  const socket = useContext(SocketContext);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!boardId) {
      console.error("useSocket: Board ID không hợp lệ:", boardId);
      setError("Không có boardId!");
      setLoading(false);
      toast.error("Không có boardId!");
      return;
    }

    // Lấy dữ liệu ban đầu qua API
    const fetchInitialData = async () => {
      try {
        console.log("useSocket: Fetching board with ID:", boardId);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token!");
        }
        const response = await axios.get(
          `http://localhost:5000/api/boards/${boardId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("useSocket: Fetched board data:", response.data);
        setBoardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("useSocket: Error fetching board:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError(err.response?.data?.message || "Không thể tải dữ liệu bảng!");
        setLoading(false);
        toast.error(
          err.response?.data?.message || "Không thể tải dữ liệu bảng!"
        );
      }
    };

    fetchInitialData();

    // Kiểm tra và kết nối socket
    if (!socket.connected) {
      console.log("useSocket: Kết nối socket...");
      socket.connect();
    } else {
      console.log("useSocket: Socket đã kết nối, tham gia phòng:", boardId);
      socket.emit("join-board", { boardId });
    }

    socket.on("connect", () => {
      console.log("useSocket: Socket kết nối:", socket.id);
      socket.emit("join-board", { boardId });
      console.log("useSocket: Tham gia phòng board:", boardId);
    });

    socket.on("connect_error", (err) => {
      console.error("useSocket: Lỗi kết nối socket:", err.message);
      setError("Không thể kết nối tới server!");
      toast.error("Lỗi kết nối server!");
      setLoading(false);
    });

    // Xử lý sự kiện liên quan đến thẻ
    socket.on("member-added", ({ cardId, members }) => {
      console.log("useSocket: Nhận member-added:", { cardId, members });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === cardId ? { ...card, members } : card
            ),
          })),
        };
      });
      toast.success("Đã thêm thành viên vào thẻ!");
    });

    socket.on("comment-added", ({ cardId, comment }) => {
      console.log("useSocket: Nhận comment-added:", { cardId, comment });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === cardId
                ? { ...card, comments: [...(card.comments || []), comment] }
                : card
            ),
          })),
        };
      });
      toast.success("Đã thêm bình luận!");
    });

    socket.on("note-added", ({ cardId, note }) => {
      console.log("useSocket: Nhận note-added:", { cardId, note });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === cardId
                ? { ...card, notes: [...(card.notes || []), note] }
                : card
            ),
          })),
        };
      });
      toast.success("Đã thêm ghi chú!");
    });

    socket.on("checklist-added", ({ cardId, checklist }) => {
      console.log("useSocket: Nhận checklist-added:", { cardId, checklist });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === cardId
                ? {
                    ...card,
                    checklists: [...(card.checklists || []), checklist],
                  }
                : card
            ),
          })),
        };
      });
      toast.success("Đã thêm checklist!");
    });

    socket.on(
      "checklist-item-added",
      ({ cardId, checklistIndex, checklist }) => {
        console.log("useSocket: Nhận checklist-item-added:", {
          cardId,
          checklistIndex,
          checklist,
        });
        setBoardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            lists: prev.lists.map((list) => ({
              ...list,
              cards: list.cards.map((card) =>
                card._id === cardId
                  ? {
                      ...card,
                      checklists: card.checklists.map((cl, idx) =>
                        idx === checklistIndex ? checklist : cl
                      ),
                    }
                  : card
              ),
            })),
          };
        });
        toast.success("Đã thêm item vào checklist!");
      }
    );

    socket.on(
      "checklist-item-toggled",
      ({ cardId, checklistIndex, checklist }) => {
        console.log("useSocket: Nhận checklist-item-toggled:", {
          cardId,
          checklistIndex,
          checklist,
        });
        setBoardData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            lists: prev.lists.map((list) => ({
              ...list,
              cards: list.cards.map((card) =>
                card._id === cardId
                  ? {
                      ...card,
                      checklists: card.checklists.map((cl, idx) =>
                        idx === checklistIndex ? checklist : cl
                      ),
                    }
                  : card
              ),
            })),
          };
        });
        toast.success("Đã cập nhật trạng thái item checklist!");
      }
    );

    socket.on("card-updated", ({ cardId, card }) => {
      console.log("useSocket: Nhận card-updated:", { cardId, card });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((c) =>
              c._id === cardId ? { ...c, ...card } : c
            ),
          })),
        };
      });
      toast.success("Đã cập nhật thẻ!");
    });

    socket.on("card-deleted", ({ cardId }) => {
      console.log("useSocket: Nhận card-deleted:", { cardId });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.filter((c) => c._id !== cardId),
          })),
        };
      });
      toast.success("Đã xóa thẻ!");
    });

    socket.on("card-completion-toggled", ({ cardId, completed }) => {
      console.log("useSocket: Nhận card-completion-toggled:", {
        cardId,
        completed,
      });
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lists: prev.lists.map((list) => ({
            ...list,
            cards: list.cards.map((card) =>
              card._id === cardId ? { ...card, completed } : card
            ),
          })),
        };
      });
      toast.success("Đã cập nhật trạng thái hoàn thành thẻ!");
    });

    socket.on("member-invited", (data) => {
      console.log("useSocket: Nhận member-invited:", data);
      setBoardData(data.board);
      toast.success(`Đã mời ${data.invitedUser.fullName} thành công!`);
    });

    socket.on("member-deactivated", (data) => {
      console.log("useSocket: Nhận member-deactivated:", data);
      setBoardData(data.board);
      toast.success("Đã xóa thành viên thành công!");
    });

    socket.on("board-updated", (data) => {
      console.log("useSocket: Nhận board-updated:", data);
      setBoardData(data.board);
      toast.success("Đã cập nhật bảng!");
    });

    socket.on("board-deleted", (data) => {
      console.log("useSocket: Nhận board-deleted:", data);
      toast.error(`Bảng đã bị xóa!`);
      setBoardData(null);
      setError("Bảng đã bị xóa!");
    });

    socket.on("error", (err) => {
      console.error("useSocket: Lỗi từ server:", err);
      setError(err.message || "Có lỗi xảy ra!");
      toast.error(err.message || "Có lỗi từ server!");
    });

    return () => {
      console.log("useSocket: Cleanup, rời phòng board:", boardId);
      socket.emit("leave-board", { boardId });
      socket.off("connect");
      socket.off("connect_error");
      socket.off("member-added");
      socket.off("comment-added");
      socket.off("note-added");
      socket.off("checklist-added");
      socket.off("checklist-item-added");
      socket.off("checklist-item-toggled");
      socket.off("card-updated");
      socket.off("card-deleted");
      socket.off("card-completion-toggled");
      socket.off("member-invited");
      socket.off("member-deactivated");
      socket.off("board-updated");
      socket.off("board-deleted");
      socket.off("error");
    };
  }, [boardId, socket]);

  const updateBoard = (data) => {
    if (!boardId) {
      console.error("useSocket: Không có boardId khi updateBoard!");
      setError("Không có boardId!");
      toast.error("Không có boardId!");
      return;
    }
    console.log("useSocket: Gửi updateBoard:", { boardId, data });
    socket.emit("update-board", { boardId, data });
  };

  return { boardData, updateBoard, loading, error };
};

export default useSocket;

import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  useMemo,
} from "react";
import Box from "@mui/material/Box";
import Column from "./Column/Column";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Button from "@mui/material/Button";
import {
  DndContext,
  closestCorners, // Có thể thử closestCenter cho thẻ nếu muốn
  PointerSensor,
  TouchSensor,
  MouseSensor,
  DragOverlay,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  Slide,
  Paper,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";

// Enhanced transition component
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function ListColumns({ boardId: propBoardId }) {
  const { boardId: urlBoardId } = useParams();
  const boardId = propBoardId || urlBoardId;
  const { socket, socketReady, isSocketLoading } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [columns, setColumns] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [openCreateColumnDialog, setOpenCreateColumnDialog] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [recentlyCreatedListId, setRecentlyCreatedListId] = useState(null);
  const [predictedPosition, setPredictedPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dragStartPosition, setDragStartPosition] = useState(null);
  const [ignoredSocketUpdates, setIgnoredSocketUpdates] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    })
  );

  const fetchBoardMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(
        `http://localhost:5000/api/boards/${boardId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoardMembers(response.data.members || []);
      console.log("ListColumns: Fetched boardMembers:", response.data.members);
    } catch (err) {
      console.error("ListColumns: Error fetching boardMembers:", err);
      toast.error("Lỗi khi tải danh sách thành viên!");
    }
  }, [boardId]);

  const fetchColumns = useCallback(async () => {
    if (!boardId) {
      console.error("ListColumns: Cannot fetch columns, boardId is missing");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(
        `http://localhost:5000/api/lists/board/${boardId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const columnsWithCards = await Promise.all(
        response.data.map(async (column) => {
          const cardsResponse = await axios.get(
            `http://localhost:5000/api/cards/list/${column._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const uniqueCards = cardsResponse.data.filter(
            (card, index, self) =>
              self.findIndex((c) => c._id === card._id) === index
          );
          return {
            ...column,
            cards: uniqueCards || [],
            isExpanded: column.isExpanded ?? true,
          };
        })
      );
      const uniqueColumns = columnsWithCards.filter(
        (col, index, self) => self.findIndex((c) => c._id === col._id) === index
      );
      setColumns(uniqueColumns);
      console.log("ListColumns: Fetched columns:", uniqueColumns);
    } catch (err) {
      console.error("ListColumns: Error fetching columns:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error("Lỗi khi tải danh sách cột!");
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      console.error("ListColumns: boardId is undefined or null");
      toast.error("Không tìm thấy boardId!");
      return;
    }
    fetchColumns();
    fetchBoardMembers();
  }, [boardId, fetchColumns, fetchBoardMembers]);

  useEffect(() => {
    if (isSocketLoading) {
      console.log("ListColumns: Waiting for socket to initialize...");
      return;
    }
    if (!socket || !socketReady || !boardId) {
      console.warn(
        "ListColumns: Socket not available, not ready, or no boardId",
        { socket: !!socket, socketReady, boardId }
      );
      return;
    }

    socket.emit("join-board", { boardId });
    console.log("ListColumns: Emitted join-board:", {
      boardId,
      socketId: socket.id,
    });

    const handleListCreated = ({ boardId: updatedBoardId, list }) => {
      if (updatedBoardId !== boardId) return;
      if (list._id === recentlyCreatedListId) {
        console.log("ListColumns: Skipping self-created list:", list._id);
        return;
      }
      setColumns((prev) => {
        if (prev.some((ws) => ws._id === list._id)) {
          console.log("ListColumns: List already exists:", list._id);
          return prev;
        }
        const newList = { ...list, cards: list.cards || [], isExpanded: true };
        console.log("ListColumns: Adding new list:", newList);
        return [...prev, newList];
      });
      toast.info("Một cột mới đã được thêm!");
    };

    const handleListDeleted = ({ boardId: updatedBoardId, listId }) => {
      if (updatedBoardId !== boardId) return;
      setColumns((prev) => {
        const newColumns = prev.filter((col) => col._id !== listId);
        console.log("ListColumns: Removed list:", listId);
        return newColumns;
      });
      toast.info("Một cột đã bị xóa!");
    };

    const handleListOrderUpdated = ({
      boardId: updatedBoardId,
      columnOrder,
    }) => {
      if (updatedBoardId !== boardId) return;
      setColumns((prevColumns) => {
        const reorderedColumns = columnOrder
          .map((id) => prevColumns.find((col) => col._id === id))
          .filter((col) => col);
        console.log("ListColumns: Reordered columns:", reorderedColumns);
        return [...reorderedColumns];
      });
      toast.info("Thứ tự cột đã được cập nhật!");
    };

    const handleCardCreated = ({ boardId: updatedBoardId, listId, card }) => {
      if (updatedBoardId !== boardId) return;
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const targetColumn = newColumns.find((col) => col._id === listId);
        if (targetColumn) {
          if (!targetColumn.cards.some((c) => c._id === card._id)) {
            targetColumn.cards = [...(targetColumn.cards || []), card];
            console.log("ListColumns: Added card to list:", { listId, card });
          }
        }
        return newColumns;
      });
      toast.info("Một thẻ mới đã được thêm!");
    };

    const handleCardDeleted = ({ boardId: updatedBoardId, listId, cardId }) => {
      if (updatedBoardId !== boardId) return;
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const targetColumn = newColumns.find((col) => col._id === listId);
        if (targetColumn) {
          targetColumn.cards = targetColumn.cards.filter(
            (card) => card._id !== cardId
          );
          console.log("ListColumns: Removed card from list:", {
            listId,
            cardId,
          });
        }
        return newColumns;
      });
      toast.info("Một thẻ đã bị xóa!");
    };

    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      console.log("ListColumns: Received card-moved:", {
        cardId: card._id,
        oldListId,
        newListId,
        newPosition,
        boardId: card.board,
        currentBoardId: boardId,
      });
      if (card.board !== boardId) {
        console.log("ListColumns: Ignoring card-moved, boardId mismatch");
        return;
      }
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const oldColumn = newColumns.find((c) => c._id === oldListId);
        const newColumn = newColumns.find((c) => c._id === newListId);

        if (!newColumn) {
          console.error(
            "ListColumns: Destination column not found:",
            newListId
          );
          return prevColumns;
        }

        if (oldColumn) {
          oldColumn.cards = oldColumn.cards.filter((c) => c._id !== card._id);
          console.log("ListColumns: Removed card from source list:", {
            oldListId,
            cardId: card._id,
          });
        }

        if (newColumn.cards.some((c) => c._id === card._id)) {
          console.warn(
            "ListColumns: Card already exists in destination list, updating position:",
            {
              newListId,
              cardId: card._id,
            }
          );
          newColumn.cards = newColumn.cards.filter((c) => c._id !== card._id);
        }

        const safePosition =
          newPosition >= 0 && newPosition <= newColumn.cards.length
            ? newPosition
            : newColumn.cards.length;
        newColumn.cards.splice(safePosition, 0, {
          ...card,
          list: newListId,
        });

        // Cập nhật lại vị trí (position) cho tất cả các thẻ trong cột mới sau khi thêm/di chuyển
        newColumn.cards = newColumn.cards
          .filter(
            (cardItem, index, self) =>
              self.findIndex((c) => c._id === cardItem._id) === index
          )
          .map((cardItem, index) => ({
            ...cardItem,
            position: index,
          }));

        console.log("ListColumns: Updated columns state:", newColumns);
        return [...newColumns];
      });
      toast.info("Một thẻ đã được di chuyển!");
    };

    const handleCardOrderUpdated = ({ listId, cardOrder }) => {
      if (!cardOrder || !Array.isArray(cardOrder)) return;
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const targetColumn = newColumns.find((col) => col._id === listId);
        if (targetColumn) {
          const reorderedCards = cardOrder
            .map((id) => targetColumn.cards.find((card) => card._id === id))
            .filter((card) => card);
          targetColumn.cards = reorderedCards
            .filter(
              (card, index, self) =>
                self.findIndex((c) => c._id === card._id) === index
            )
            .map((card, index) => ({
              ...card,
              position: index,
            }));
          console.log("ListColumns: Updated card order for list:", {
            listId,
            cardOrder,
          });
        }
        return [...newColumns];
      });
      toast.info("Thứ tự thẻ đã được cập nhật!");
    };

    const handleMemberDeactivated = (data) => {
      if (data.boardId !== boardId) return;
      if (data.deactivatedUserId === localStorage.getItem("userId")) {
        toast.info("Bạn đã bị xóa khỏi bảng này!");
        setColumns([]);
        setBoardMembers([]);
      } else {
        setBoardMembers((prev) =>
          prev.map((member) =>
            member.user._id.toString() === data.deactivatedUserId
              ? { ...member, isActive: false }
              : member
          )
        );
      }
    };

    const handleMemberInvited = ({ board, invitedUser }) => {
      if (board._id !== boardId) return;
      console.log("ListColumns: Received member-invited:", {
        boardId,
        invitedUser,
      });
      setBoardMembers(board.members || []);
    };

    const handleJoinedBoard = ({ boardId: joinedBoardId }) => {
      console.log("ListColumns: Confirmed joined board:", joinedBoardId);
    };

    const handleReconnect = () => {
      console.log("ListColumns: Socket reconnected, syncing columns");
      fetchColumns();
      socket.emit("join-board", { boardId });
      console.log("ListColumns: Re-emitted join-board:", {
        boardId,
        socketId: socket.id,
      });
    };

    socket.on("joined-board", handleJoinedBoard);
    socket.on("list-created", handleListCreated);
    socket.on("list-deleted", handleListDeleted);
    socket.on("list-order-updated", handleListOrderUpdated);
    socket.on("card-created", handleCardCreated);
    socket.on("card-deleted", handleCardDeleted);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-order-updated", handleCardOrderUpdated);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("member-invited", handleMemberInvited);
    socket.on("reconnect", handleReconnect);

    return () => {
      socket.off("joined-board", handleJoinedBoard);
      socket.off("list-created", handleListCreated);
      socket.off("list-deleted", handleListDeleted);
      socket.off("list-order-updated", handleListOrderUpdated);
      socket.off("card-created", handleCardCreated);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-order-updated", handleCardOrderUpdated);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("member-invited", handleMemberInvited);
      socket.off("reconnect", handleReconnect);
      socket.emit("leave-board", { boardId });
      console.log("ListColumns: Emitted leave-board:", { boardId });
    };
  }, [
    boardId,
    socket,
    socketReady,
    isSocketLoading,
    recentlyCreatedListId,
    fetchColumns,
  ]);

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) {
      toast.error("Tiêu đề cột không được để trống!");
      return;
    }
    if (!boardId) {
      toast.error("Không tìm thấy boardId!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.post(
        "http://localhost:5000/api/lists",
        {
          title: newColumnTitle,
          board: boardId,
          position: columns.length,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newList = { ...response.data, cards: [], isExpanded: true };
      setColumns((prev) => [...prev, newList]);
      setRecentlyCreatedListId(newList._id);
      if (socket && socketReady) {
        socket.emit("list-created", { boardId, list: newList });
        console.log("ListColumns: Emitted list-created:", {
          boardId,
          list: newList,
        });
      }
      setOpenCreateColumnDialog(false);
      setNewColumnTitle("");
      toast.success("Tạo cột thành công!");
      setTimeout(() => setRecentlyCreatedListId(null), 1000);
    } catch (err) {
      console.error("ListColumns: Error creating column:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error("Lỗi khi tạo cột!");
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const dragData = active.data.current;

    console.log("ListColumns: Drag event data:", {
      activeId: active.id,
      dragData: JSON.stringify(dragData, null, 2),
    });

    if (!dragData) {
      console.error("ListColumns: No data in active drag item", active);
      return;
    }

    const dragItem = {
      id: active.id,
      type: dragData.type,
      data: dragData,
    };

    if (dragData.type === "Column" && !dragData.column) {
      console.error("ListColumns: Column data missing for drag item", active);
      return;
    }

    setActiveDragItem(dragItem);
    setDragStartPosition({
      x: event.activatorEvent.clientX,
      y: event.activatorEvent.clientY,
    });

    console.log("ListColumns: Drag started:", {
      type: dragData.type,
      id: active.id,
      column: dragData.column,
    });

    document.body.classList.add("is-dragging");
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setPredictedPosition(null);
      return;
    }

    if (active.data.current?.type !== "Card") {
      setPredictedPosition(null);
      return;
    }

    let overColumnId, overCardId, insertIndex;
    const activeColumnId = active.data.current?.card?.list;

    // Tìm cột đích và vị trí thẻ đích (nếu có)
    if (over.data.current?.type === "Card") {
      overColumnId = over.data.current?.card?.list;
      overCardId = over.id;

      const overColumn = columns.find((c) => c._id === overColumnId);
      if (!overColumn) {
        setPredictedPosition(null);
        return;
      }

      const overCardIndex = overColumn.cards.findIndex((c) => c._id === overCardId);

      // Tính toán vị trí thả chính xác dựa trên tọa độ Y
      const overItemTop = over.rect?.top || 0;
      const overItemHeight = over.rect?.height || 0;
      const overItemMiddle = overItemTop + overItemHeight / 2;
      const draggedItemY = active.rect.current.translated?.top || event.activatorEvent.clientY;

      const isBelowOverItem = draggedItemY > overItemMiddle;

      insertIndex = isBelowOverItem ? overCardIndex + 1 : overCardIndex;
    } else if (
      over.data.current?.type === "Column" ||
      over.data.current?.type === "List"
    ) {
      // Kéo vào một cột (không có thẻ nào để kéo qua)
      overColumnId = over.data.current?.listId || over.id;

      const overColumn = columns.find((c) => c._id === overColumnId);
      if (!overColumn) {
        setPredictedPosition(null);
        return;
      }

      insertIndex = overColumn.cards.length; // Thả vào cuối cột
    } else {
      setPredictedPosition(null);
      return;
    }

    const dragCardHeight = active.rect?.current?.height || active.rect?.height || 100;

    setPredictedPosition((prev) => {
      // Chỉ cập nhật nếu có sự thay đổi đáng kể để tránh re-render không cần thiết
      if (
        prev &&
        prev.listId === overColumnId &&
        prev.index === insertIndex &&
        Math.abs(prev.height - dragCardHeight) < 5
      ) {
        return prev;
      }
      return {
        listId: overColumnId,
        index: insertIndex,
        height: dragCardHeight,
      };
    });
  };

  const handleDragEnd = useCallback(
    async (event) => {
      setActiveDragItem(null);
      setPredictedPosition(null);
      setDragStartPosition(null);
      document.body.classList.remove("is-dragging");

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // ============================================
      // KÉO THẢ CỘT
      // ============================================
      if (active.data.current?.type === "Column") {
        const oldIndex = columns.findIndex((c) => c._id === active.id);
        const newIndex = columns.findIndex((c) => c._id === over.id);

        if (oldIndex === newIndex) return; // Không thay đổi vị trí

        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns); // Cập nhật UI ngay lập tức

        try {
          const token = localStorage.getItem("token");
          if (!token) throw new Error("No token found");
          const columnOrder = newColumns.map((column) => column._id);
          await axios.put(
            `http://localhost:5000/api/lists/board/${boardId}/list-order`,
            { columnOrder },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (socket && socketReady) {
            socket.emit("list-order-updated", { boardId, columnOrder });
          }
          toast.success("Cập nhật thứ tự cột thành công!");
        } catch (err) {
          console.error("ListColumns: Error updating column order:", err);
          toast.error("Lỗi khi cập nhật thứ tự cột!");
          fetchColumns(); // Rollback nếu có lỗi
        }
        return;
      }

      // ============================================
      // KÉO THẢ THẺ
      // ============================================
      if (active.data.current?.type === "Card") {
        const activeCardId = active.id;
        const activeColumnId = active.data.current?.card?.list;
        let overColumnId;

        // Xác định cột đích (overColumnId)
        if (over.data.current?.type === "Card") {
          overColumnId = over.data.current?.card?.list;
        } else if (
          over.data.current?.type === "Column" ||
          over.data.current?.type === "List"
        ) {
          overColumnId = over.data.current?.listId || over.id;
        } else {
          console.error("ListColumns: Unknown drop target!", over.data.current);
          return;
        }

        const activeColumnIndex = columns.findIndex(
          (c) => c._id === activeColumnId
        );
        const overColumnIndex = columns.findIndex(
          (c) => c._id === overColumnId
        );

        if (activeColumnIndex === -1 || overColumnIndex === -1) {
          console.error("ListColumns: Source or destination column not found!");
          return;
        }

        const activeCard = columns[activeColumnIndex].cards.find(
          (c) => c._id === activeCardId
        );
        if (!activeCard) {
          console.error("ListColumns: Source card not found!");
          return;
        }

        // Tạo bản sao của `columns` để thay đổi
        const newColumnsState = [...columns];
        const sourceColumn = newColumnsState[activeColumnIndex];
        const destinationColumn = newColumnsState[overColumnIndex];

        // Loại bỏ thẻ khỏi cột nguồn
        sourceColumn.cards = sourceColumn.cards.filter(
          (c) => c._id !== activeCardId
        );

        // Xác định vị trí chèn vào cột đích
        let newCardIndex = 0; // Mặc định chèn đầu nếu không có over.id
        if (over.data.current?.type === "Card") {
          const overCardIndex = destinationColumn.cards.findIndex(
            (c) => c._id === over.id
          );
          // Sử dụng `predictedPosition.index` nếu có và hợp lệ để đồng bộ với UI preview
          if (
            predictedPosition &&
            predictedPosition.listId === overColumnId &&
            predictedPosition.index !== undefined
          ) {
            newCardIndex = predictedPosition.index;
          } else {
            // Fallback nếu predictedPosition không khả dụng
            const overItemTop = over.rect?.top || 0;
            const overItemHeight = over.rect?.height || 0;
            const overItemMiddle = overItemTop + overItemHeight / 2;
            const draggedItemY = active.rect.current.translated?.top || event.activatorEvent.clientY;
            newCardIndex = draggedItemY > overItemMiddle ? overCardIndex + 1 : overCardIndex;
          }
        } else if (over.data.current?.type === "Column" || over.data.current?.type === "List") {
          // Thả vào một cột trống hoặc vào cuối cột
          newCardIndex = destinationColumn.cards.length;
        }


        // Đảm bảo index hợp lệ
        newCardIndex = Math.max(0, Math.min(newCardIndex, destinationColumn.cards.length));

        // Thêm thẻ vào cột đích
        const updatedCard = { ...activeCard, list: overColumnId };
        destinationColumn.cards.splice(newCardIndex, 0, updatedCard);

        // Loại bỏ trùng lặp và cập nhật lại `position` cho tất cả thẻ trong cả hai cột liên quan
        sourceColumn.cards = sourceColumn.cards
          .filter(
            (cardItem, index, self) =>
              self.findIndex((c) => c._id === cardItem._id) === index
          )
          .map((cardItem, index) => ({
            ...cardItem,
            position: index,
          }));

        destinationColumn.cards = destinationColumn.cards
          .filter(
            (cardItem, index, self) =>
              self.findIndex((c) => c._id === cardItem._id) === index
          )
          .map((cardItem, index) => ({
            ...cardItem,
            position: index,
          }));

        setColumns(newColumnsState); // Cập nhật UI ngay lập tức

        // Gửi yêu cầu API và cập nhật Socket
        (async () => {
          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            if (activeColumnId === overColumnId) {
              // Kéo trong cùng cột
              const cardOrder = destinationColumn.cards.map((card) => card._id);
              await axios.put(
                `http://localhost:5000/api/lists/card-order/${activeColumnId}`,
                { cardOrder },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (socket && socketReady) {
                socket.emit("card-order-updated", {
                  listId: activeColumnId,
                  cardOrder,
                });
              }
              toast.success("Cập nhật thứ tự thẻ thành công!");
            } else {
              // Kéo sang cột khác
              await axios.put(
                `http://localhost:5000/api/cards/${activeCardId}/move`,
                {
                  newListId: overColumnId,
                  newBoardId: boardId,
                  newPosition: newCardIndex,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (socket && socketReady) {
                socket.emit("card-moved", {
                  card: updatedCard,
                  oldListId: activeColumnId,
                  newListId: overColumnId,
                  newPosition: newCardIndex,
                });
              }

              toast.success("Di chuyển thẻ thành công!");
            }
          } catch (err) {
            console.error("ListColumns: Error moving card:", err);
            toast.error("Lỗi khi di chuyển thẻ!");
            fetchColumns(); // Rollback nếu có lỗi
          }
        })();
      }
    },
    [columns, boardId, socket, socketReady, fetchColumns, predictedPosition] // Thêm predictedPosition vào dependency array
  );

  const columnIds = useMemo(() => columns.map((c) => c._id), [columns]);

  // Enhanced loading skeleton
  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          p: { xs: 1, sm: 2 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        {[...Array(3)].map((_, index) => (
          <Box
            key={index}
            sx={{
              minWidth: "350px",
              maxWidth: "400px",
              borderRadius: "12px",
              bgcolor: isDarkMode ? "#2a2a3d" : "#f4f5f7",
              height: "400px",
              opacity: 0.7,
              animation: "pulse 1.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%": { opacity: 0.4 },
                "50%": { opacity: 0.8 },
                "100%": { opacity: 0.4 },
              },
            }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        // Global drag styles
        "&.is-dragging": {
          "& *": {
            userSelect: "none",
            pointerEvents: "none",
          },
          "& .drag-handle": {
            pointerEvents: "auto",
          },
        },
      }}
    >
      <style>
        {`
          .is-dragging * {
            user-select: none !important;
            pointerEvents: none !important;
            cursor: grabbing !important;
          }

          .is-dragging .drag-handle {
            pointerEvents: auto !important;
          }

          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .column-enter {
            animation: slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .column-exit {
            animation: slideOutToRight 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
          }

          @keyframes slideOutToRight {
            from {
              opacity: 1;
              transform: translateX(0);
            }
            to {
              opacity: 0;
              transform: translateX(50px);
            }
          }
        `}
      </style>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <Box
            sx={{
              width: "100%",
              height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
              display: "flex",
              overflowX: "auto",
              overflowY: "hidden",
              p: { xs: 1, sm: 2 },
              gap: { xs: 1, sm: 2 },
              position: "relative",
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": {
                height: { xs: "8px", sm: "12px" },
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: isDarkMode
                  ? "rgba(42, 42, 61, 0.3)"
                  : "rgba(0, 0, 0, 0.05)",
                borderRadius: "10px",
                m: 1,
              },
              "&::-webkit-scrollbar-thumb": {
                background: isDarkMode
                  ? `linear-gradient(135deg, ${theme.palette.primary.main}40, ${theme.palette.secondary.main}40)`
                  : `linear-gradient(135deg, ${theme.palette.primary.main}60, ${theme.palette.primary.dark}60)`,
                borderRadius: "10px",
                border: `2px solid ${isDarkMode ? "#2a2a3d" : "#f4f5f7"}`,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                    : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                },
              },
            }}
          >
            {columns?.length > 0 ? (
              columns.map((column, index) => (
                <Fade
                  key={column._id}
                  in={true}
                  timeout={300 + index * 100}
                  style={{ transformOrigin: "left center" }}
                >
                  <Box className="column-enter">
                    <Column
                      column={column}
                      setColumns={setColumns}
                      boardId={boardId}
                      boardMembers={boardMembers}
                      setBoardMembers={setBoardMembers}
                      initialExpanded={column.isExpanded ?? true}
                      predictedPosition={
                        predictedPosition?.listId === column._id
                          ? predictedPosition
                          : null
                      }
                    />
                  </Box>
                </Fade>
              ))
            ) : (
              <Fade in={true} timeout={800}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    color: isDarkMode
                      ? theme.palette.grey[400]
                      : theme.palette.text.secondary,
                    bgcolor: isDarkMode
                      ? "rgba(42, 42, 61, 0.3)"
                      : "rgba(244, 245, 247, 0.8)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "16px",
                    mx: 1,
                    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                      }`,
                    textAlign: "center",
                    minWidth: "350px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      bgcolor: isDarkMode
                        ? "rgba(42, 42, 61, 0.5)"
                        : "rgba(244, 245, 247, 0.95)",
                      boxShadow: isDarkMode
                        ? "0 8px 32px rgba(0,0,0,0.3)"
                        : "0 8px 32px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      bgcolor: isDarkMode
                        ? `${theme.palette.primary.main}20`
                        : `${theme.palette.primary.main}10`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                    }}
                  >
                    <NoteAddIcon
                      sx={{
                        fontSize: 28,
                        color: theme.palette.primary.main,
                        opacity: 0.7,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Chưa có cột nào
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.8,
                      maxWidth: 280,
                      lineHeight: 1.6,
                    }}
                  >
                    Bắt đầu tạo cột đầu tiên để tổ chức công việc của bạn
                  </Typography>
                </Paper>
              </Fade>
            )}

            {/* Enhanced Add Column Button */}
            <Fade in={true} timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  minWidth: "280px",
                  maxWidth: "280px",
                  mx: 1,
                  borderRadius: "16px",
                  height: "fit-content",
                  bgcolor: isDarkMode
                    ? "rgba(42, 42, 61, 0.4)"
                    : "rgba(244, 245, 247, 0.6)",
                  backdropFilter: "blur(15px)",
                  border: `2px dashed ${isDarkMode
                    ? theme.palette.primary.main + "40"
                    : theme.palette.primary.main + "30"
                    }`,
                  transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: "-100%",
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(90deg, transparent, ${isDarkMode
                      ? theme.palette.primary.main + "20"
                      : theme.palette.primary.main + "10"
                      }, transparent)`,
                    transition: "left 0.6s ease",
                  },
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(42, 42, 61, 0.7)"
                      : "rgba(244, 245, 247, 0.9)",
                    border: `2px dashed ${theme.palette.primary.main}`,
                    transform: "translateY(-6px) scale(1.02)",
                    boxShadow: isDarkMode
                      ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${theme.palette.primary.main}20`
                      : `0 12px 40px rgba(0,0,0,0.15), 0 0 0 1px ${theme.palette.primary.main}20`,
                    "&::before": {
                      left: "100%",
                    },
                  },
                }}
              >
                <Button
                  startIcon={
                    <NoteAddIcon
                      sx={{
                        fontSize: "20px !important",
                        transition: "all 0.3s ease",
                      }}
                    />
                  }
                  onClick={() => setOpenCreateColumnDialog(true)}
                  sx={{
                    color: isDarkMode
                      ? theme.palette.grey[200]
                      : theme.palette.text.primary,
                    width: "100%",
                    justifyContent: "flex-start",
                    pl: 3,
                    pr: 3,
                    py: 2.5,
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    borderRadius: "16px",
                    transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    "&:hover": {
                      bgcolor: "transparent",
                      color: theme.palette.primary.main,
                      "& .MuiButton-startIcon": {
                        transform: "rotate(180deg) scale(1.1)",
                      },
                    },
                  }}
                >
                  Thêm cột mới
                </Button>
              </Paper>
            </Fade>
          </Box>
        </SortableContext>
        {/* Enhanced Dialog */}
        <Dialog
          open={openCreateColumnDialog}
          onClose={() => {
            setOpenCreateColumnDialog(false);
            setNewColumnTitle("");
          }}
          TransitionComponent={Transition}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "20px",
              bgcolor: isDarkMode
                ? "rgba(42, 42, 61, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
                }`,
              boxShadow: isDarkMode
                ? "0 24px 48px rgba(0,0,0,0.4)"
                : "0 24px 48px rgba(0,0,0,0.12)",
              overflow: "visible",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
              },
            },
          }}
        >
          <DialogTitle
            sx={{
              pb: 1,
              pt: 3,
              px: 3,
              fontWeight: 700,
              fontSize: "1.4rem",
              color: isDarkMode
                ? theme.palette.grey[100]
                : theme.palette.text.primary,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Tạo cột mới
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Tiêu đề cột"
              type="text"
              fullWidth
              variant="outlined"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && newColumnTitle.trim()) {
                  handleCreateColumn();
                }
              }}
              sx={{
                mt: 2,
                "& .MuiInputBase-root": {
                  borderRadius: "12px",
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.02)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                  },
                  "&.Mui-focused": {
                    bgcolor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(255, 255, 255, 0.8)",
                    boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
                  },
                },
                "& .MuiInputLabel-root": {
                  fontWeight: 500,
                  "&.Mui-focused": {
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                  },
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode
                    ? theme.palette.grey[600]
                    : theme.palette.grey[300],
                  borderWidth: "2px",
                  transition: "all 0.3s ease",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main + "60",
                },
                "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main,
                  borderWidth: "2px",
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
            <Button
              onClick={() => {
                setOpenCreateColumnDialog(false);
                setNewColumnTitle("");
              }}
              sx={{
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
                fontWeight: 600,
                borderRadius: "10px",
                px: 3,
                py: 1,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? theme.palette.grey[800]
                    : theme.palette.grey[100],
                  color: isDarkMode
                    ? theme.palette.grey[200]
                    : theme.palette.text.primary,
                  transform: "translateY(-1px)",
                },
              }}
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleCreateColumn}
              disabled={!newColumnTitle.trim()}
              variant="contained"
              sx={{
                fontWeight: 700,
                borderRadius: "10px",
                px: 4,
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 12px ${theme.palette.primary.main}40`,
                transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                  transform: "translateY(-2px)",
                  boxShadow: `0 8px 20px ${theme.palette.primary.main}60`,
                },
                "&:disabled": {
                  background: theme.palette.grey[400],
                  color: theme.palette.grey[600],
                  boxShadow: "none",
                },
              }}
            >
              Tạo ngay
            </Button>
          </DialogActions>
        </Dialog>

        {/* Enhanced Drag Overlay */}
        <DragOverlay
          dropAnimation={{
            duration: 400,
            easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        >
          {activeDragItem?.type === "Column" && activeDragItem?.data?.column && (
            <Paper
              elevation={12}
              sx={{
                bgcolor: isDarkMode ? "#2a2a3d" : "#f4f5f7",
                borderRadius: "16px",
                boxShadow: isDarkMode
                  ? "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)"
                  : "0 20px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)",
                opacity: 0.95,
                transform: "scale(1.02) rotate(2deg)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "grabbing",
                minWidth: "350px",
                maxWidth: "400px",
                height: activeDragItem.data.column.isExpanded ?? true
                  ? "fit-content"
                  : "56px",
                maxHeight: activeDragItem.data.column.isExpanded ?? true
                  ? `calc(100vh - 100px)`
                  : "56px",
                zIndex: 1000,
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                },
              }}
            >
              <Column
                column={activeDragItem.data.column}
                setColumns={setColumns}
                boardId={boardId}
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
              />
            </Paper>
          )}
          {activeDragItem?.type === "Card" && (
            <Paper
              elevation={16}
              sx={{
                bgcolor: isDarkMode ? "#3a3a50" : "#fff",
                borderRadius: "16px",
                boxShadow: isDarkMode
                  ? "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)"
                  : "0 20px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)",
                opacity: 0.95,
                transform: "scale(1.03) rotate(-1deg)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                p: 2.5,
                cursor: "grabbing",
                border: activeDragItem.data.card.completed
                  ? `3px solid ${theme.palette.success.main}`
                  : `2px solid ${isDarkMode ? theme.palette.grey[600] : theme.palette.grey[200]
                  }`,
                height: "auto",
                minHeight: "120px",
                width: "100%",
                maxWidth: "320px",
                zIndex: 1000,
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}40, ${theme.palette.secondary.main}40)`,
                  borderRadius: "18px",
                  zIndex: -1,
                },
              }}
            >
              <Typography variant="body1" fontWeight={500}>
                {activeDragItem.data.card.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeDragItem.data.card.description}
              </Typography>
              {/* Add more card content as needed */}
            </Paper>
          )}
        </DragOverlay>
      </DndContext>
    </Box>
  );
}

export default ListColumns;
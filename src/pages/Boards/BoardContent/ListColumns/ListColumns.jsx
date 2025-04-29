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
  rectIntersection,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  DragOverlay,
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
} from "@mui/material";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SocketContext } from "../../../../context/SocketContext";
import { useTheme } from "@mui/material/styles";
import Cards from "./Column/ListCards/Cards/Cards";

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

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
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
        if (prev.some((col) => col._id === list._id)) {
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

        newColumn.cards = newColumn.cards.filter(
          (card, index, self) =>
            self.findIndex((c) => c._id === card._id) === index
        );

        console.log("ListColumns: Updated columns state:", newColumns);
        return [...newColumns];
      });
      toast.info("Một thẻ đã được di chuyển!");
    };

    const handleCardOrderUpdated = ({ listId, cardOrder }) => {
      if (!cardOrder || !Array.isArray(cardOrder)) return;
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const targetColumn = newColumns.find((c) => c._id === listId);
        if (targetColumn) {
          const reorderedCards = cardOrder
            .map((id) => targetColumn.cards.find((card) => card._id === id))
            .filter((card) => card);
          targetColumn.cards = reorderedCards.filter(
            (card, index, self) =>
              self.findIndex((c) => c._id === card._id) === index
          );
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
    setActiveDragItem({
      id: event.active.id,
      type: event.active.data.current?.type,
      data: event.active.data.current,
    });
    console.log("ListColumns: Drag started:", {
      type: event.active.data.current?.type,
      id: event.active.id,
    });
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (
      !over ||
      active.id === over.id ||
      active.data.current?.type !== "Card"
    ) {
      setPredictedPosition(null);
      return;
    }

    let overColumnId, overCardId;
    if (over.data.current?.type === "Card") {
      overColumnId = over.data.current?.card?.list;
      overCardId = over.id;
    } else if (
      over.data.current?.type === "Column" ||
      over.data.current?.type === "List"
    ) {
      overColumnId = over.data.current?.listId || over.id;
    } else {
      setPredictedPosition(null);
      return;
    }

    const overColumnIndex = columns.findIndex((c) => c._id === overColumnId);
    if (overColumnIndex === -1) {
      setPredictedPosition(null);
      return;
    }

    let insertIndex = overCardId
      ? columns[overColumnIndex].cards.findIndex((c) => c._id === overCardId) +
        1
      : columns[overColumnIndex].cards.length;

    if (insertIndex === -1) insertIndex = 0;

    setPredictedPosition({
      listId: overColumnId,
      index: insertIndex,
    });
  };

  const handleDragEnd = useCallback(
    async (event) => {
      setActiveDragItem(null);
      setPredictedPosition(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (active.data.current?.type === "Column") {
        const oldIndex = columns.findIndex((c) => c._id === active.id);
        const newIndex = columns.findIndex((c) => c._id === over.id);
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);

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
            console.log("ListColumns: Emitted list-order-updated:", {
              boardId,
              columnOrder,
            });
          }
          toast.success("Cập nhật thứ tự cột thành công!");
        } catch (err) {
          console.error("ListColumns: Error updating column order:", {
            message: err.message,
            response: err.response?.data,
          });
          toast.error(
            `Lỗi khi cập nhật thứ tự cột: ${
              err.response?.data?.message || err.message
            }`
          );
          fetchColumns();
        }
        return;
      }

      if (active.data.current?.type === "Card") {
        const activeCardId = active.id;
        const activeColumnId = active.data.current?.card?.list;
        let overColumnId, overCardId;

        if (over.data.current?.type === "Card") {
          overColumnId = over.data.current?.card?.list;
          overCardId = over.id;
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

        const newColumns = [...columns];

        if (activeColumnId === overColumnId) {
          const sourceCards = [...newColumns[activeColumnIndex].cards];
          const activeCardIndex = sourceCards.findIndex(
            (c) => c._id === activeCardId
          );
          let overCardIndex = overCardId
            ? sourceCards.findIndex((c) => c._id === overCardId)
            : sourceCards.length;

          if (overCardIndex > activeCardIndex) {
            overCardIndex -= 1;
          }

          const reorderedCards = arrayMove(
            sourceCards,
            activeCardIndex,
            overCardIndex
          );
          const uniqueCards = reorderedCards.filter(
            (card, index, self) =>
              self.findIndex((c) => c._id === card._id) === index
          );
          newColumns[activeColumnIndex].cards = uniqueCards;

          setColumns([...newColumns]);

          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            const cardOrder = uniqueCards.map((card) => card._id);
            console.log("ListColumns: Sending card order update:", {
              listId: activeColumnId,
              cardOrder,
            });
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
              console.log("ListColumns: Emitted card-order-updated:", {
                listId: activeColumnId,
                cardOrder,
              });
            }
            toast.success("Cập nhật thứ tự thẻ thành công!");
          } catch (err) {
            console.error("ListColumns: Error updating card order:", {
              message: err.message,
              response: err.response?.data,
            });
            toast.error(
              `Lỗi khi cập nhật thứ tự thẻ: ${
                err.response?.data?.message || err.message
              }`
            );
            fetchColumns();
          }
        } else {
          newColumns.forEach((col) => {
            col.cards = col.cards.filter((c) => c._id !== activeCardId);
          });

          const updatedCard = { ...activeCard, list: overColumnId };
          let insertIndex = overCardId
            ? newColumns[overColumnIndex].cards.findIndex(
                (c) => c._id === overCardId
              ) + 1
            : newColumns[overColumnIndex].cards.length;

          if (insertIndex === -1) insertIndex = 0;

          newColumns[overColumnIndex].cards.splice(insertIndex, 0, updatedCard);

          newColumns[overColumnIndex].cards = newColumns[
            overColumnIndex
          ].cards.filter(
            (card, index, self) =>
              self.findIndex((c) => c._id === card._id) === index
          );

          setColumns([...newColumns]);

          try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("No token found");

            console.log("ListColumns: Moving card:", {
              cardId: activeCardId,
              newListId: overColumnId,
              newBoardId: boardId,
              newPosition: insertIndex,
            });
            await axios.put(
              `http://localhost:5000/api/cards/${activeCardId}/move`,
              {
                newListId: overColumnId,
                newBoardId: boardId,
                newPosition: insertIndex,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (socket && socketReady) {
              socket.emit("card-moved", {
                card: updatedCard,
                oldListId: activeColumnId,
                newListId: overColumnId,
                newPosition: insertIndex,
              });
              console.log("ListColumns: Emitted card-moved:", {
                cardId: updatedCard._id,
                oldListId: activeColumnId,
                newListId: overColumnId,
                newPosition: insertIndex,
              });
            }
            toast.success("Di chuyển thẻ thành công!");
          } catch (err) {
            console.error("ListColumns: Error moving card:", {
              message: err.message,
              response: err.response?.data,
            });
            toast.error(
              `Lỗi khi di chuyển thẻ: ${
                err.response?.data?.message || err.message
              }`
            );
            fetchColumns();
          }
        }
      }
    },
    [columns, boardId, socket, socketReady, fetchColumns]
  );

  const sortableItems = useMemo(() => {
    if (!Array.isArray(columns)) {
      console.error("ListColumns: columns is not an array", columns);
      return [];
    }
    const items = [
      ...columns.map((c) => ({ id: c._id, type: "Column" })),
      ...columns.flatMap((c) => {
        if (!Array.isArray(c.cards)) {
          console.error("ListColumns: c.cards is not an array", c);
          return [];
        }
        const uniqueCards = c.cards.filter(
          (card, index, self) =>
            self.findIndex((c) => c._id === card._id) === index
        );
        return uniqueCards.map((card) => ({
          id: card._id,
          type: "Card",
          list: c._id,
        }));
      }),
    ];
    const uniqueItems = items.filter(
      (item, index, self) =>
        self.findIndex((i) => i.id === item.id && i.type === item.type) ===
        index
    );
    console.log("ListColumns: sortableItems created", uniqueItems);
    return uniqueItems;
  }, [columns]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableItems}
        strategy={horizontalListSortingStrategy}
      >
        <Box
          sx={{
            bgcolor: isDarkMode ? "#1e1e2d" : "inherit",
            width: "100%",
            height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
            display: "flex",
            overflowX: "auto",
            overflowY: "hidden",
            p: { xs: 1, sm: 2 },
            gap: { xs: 1, sm: 2 },
            "&::-webkit-scrollbar": {
              height: { xs: "6px", sm: "10px" },
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: isDarkMode ? "#2a2a3d" : theme.palette.grey[200],
              borderRadius: "8px",
              m: 1,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDarkMode ? "#666" : theme.palette.grey[400],
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: isDarkMode ? "#888" : theme.palette.grey[500],
              },
            },
          }}
        >
          {columns?.length > 0 ? (
            columns.map((column) => (
              <Column
                key={column._id}
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
            ))
          ) : (
            <Box
              sx={{
                p: 2,
                color: isDarkMode
                  ? theme.palette.grey[400]
                  : theme.palette.text.secondary,
                bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.grey[100],
                borderRadius: "8px",
                mx: 1,
                boxShadow: isDarkMode
                  ? "0 2px 8px rgba(0,0,0,0.3)"
                  : theme.shadows[2],
              }}
            >
              Không có cột nào trong bảng này.
            </Box>
          )}

          <Box
            sx={{
              minWidth: "250px",
              maxWidth: "250px",
              mx: 1,
              borderRadius: "8px",
              height: "fit-content",
              bgcolor: isDarkMode ? "#2a2a3d" : theme.palette.grey[100],
              boxShadow: isDarkMode
                ? "0 2px 8px rgba(0,0,0,0.3)"
                : theme.shadows[2],
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: isDarkMode ? "#3a3a50" : theme.palette.grey[200],
                transform: "translateY(-2px)",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0,0,0,0.4)"
                  : theme.shadows[3],
              },
            }}
          >
            <Button
              startIcon={<NoteAddIcon />}
              onClick={() => setOpenCreateColumnDialog(true)}
              sx={{
                color: isDarkMode
                  ? theme.palette.grey[200]
                  : theme.palette.text.primary,
                width: "100%",
                justifyContent: "flex-start",
                pl: 2,
                py: 1.5,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                  bgcolor: isDarkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "transparent",
                  color: isDarkMode
                    ? theme.palette.grey[100]
                    : theme.palette.text.primary,
                },
              }}
            >
              Thêm cột mới
            </Button>
          </Box>
        </Box>

        <Dialog
          open={openCreateColumnDialog}
          onClose={() => {
            setOpenCreateColumnDialog(false);
            setNewColumnTitle("");
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Thêm cột mới</DialogTitle>
          <DialogContent>
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
                if (e.key === "Enter") {
                  handleCreateColumn();
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpenCreateColumnDialog(false);
                setNewColumnTitle("");
              }}
              color="inherit"
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateColumn}
              color="primary"
              variant="contained"
            >
              Tạo
            </Button>
          </DialogActions>
        </Dialog>

        <DragOverlay dropAnimation={null}>
          {activeDragItem?.type === "Column" && (
            <Box
              sx={{
                bgcolor: isDarkMode ? "#2a2a3d" : "#f4f5f7",
                borderRadius: "12px",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0,0,0,0.6)"
                  : "0 4px 12px rgba(0,0,0,0.2)",
                opacity: 0.95,
                transform: "scale(1.01)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "grabbing",
                minWidth: "300px",
                maxWidth: "300px",
                height: activeDragItem.data.isExpanded ? "fit-content" : "56px",
                maxHeight: activeDragItem.data.isExpanded
                  ? `calc(100vh - 100px)`
                  : "56px",
                zIndex: 1000,
              }}
            >
              <Column
                column={activeDragItem.data}
                setColumns={setColumns}
                boardId={boardId}
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
                initialExpanded={activeDragItem.data.isExpanded}
              />
            </Box>
          )}
          {activeDragItem?.type === "Card" && (
            <Box
              sx={{
                bgcolor: isDarkMode ? "#3a3a50" : "#fff",
                borderRadius: "12px",
                boxShadow: isDarkMode
                  ? "0 2px 12px rgba(0,0,0,0.6)"
                  : "0 2px 12px rgba(0,0,0,0.2)",
                opacity: 0.95,
                transform: "scale(1.01)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                p: 2,
                cursor: "grabbing",
                border: activeDragItem.data.card.completed
                  ? `2px solid ${theme.palette.success.main}`
                  : `1px solid ${theme.palette.divider}`,
                height: "120px",
                width: "100%",
                maxWidth: "300px",
                zIndex: 1000,
              }}
            >
              <Cards
                card={activeDragItem.data.card}
                setCards={() => {}}
                setColumns={setColumns}
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
              />
            </Box>
          )}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}

export default ListColumns;

import React, { useEffect, useState, useCallback, useContext } from "react";
import Box from "@mui/material/Box";
import Column from "./Column/Column";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import Button from "@mui/material/Button";
import {
  DndContext,
  closestCorners,
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
import Cards from "./Column/ListCards/Cards/Cards"; // Thêm import Cards

function ListColumns({ boardId: propBoardId }) {
  const { boardId: urlBoardId } = useParams();
  const boardId = propBoardId || urlBoardId;
  const { socket, socketReady } = useContext(SocketContext);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [columns, setColumns] = useState([]);
  const [boardMembers, setBoardMembers] = useState([]);
  const [openCreateColumnDialog, setOpenCreateColumnDialog] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

  // Hàm lấy boardMembers từ API
  const fetchBoardMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const response = await axios.get(
        `http://localhost:5000/api/boards/${boardId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBoardMembers(response.data.members || []);
      console.log("Fetched boardMembers:", response.data.members);
    } catch (err) {
      console.error("Error fetching boardMembers:", err);
      toast.error("Lỗi khi tải danh sách thành viên!");
    }
  }, [boardId]);

  // Hàm lấy danh sách cột
  const fetchColumns = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
      }

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
          return {
            ...column,
            cards: cardsResponse.data,
            isExpanded: column.isExpanded ?? true,
          };
        })
      );
      setColumns(columnsWithCards);
    } catch (err) {
      console.error("Error fetching columns:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Có lỗi khi lấy danh sách cột: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      console.error("boardId is undefined or null.");
      toast.error("Không tìm thấy boardId! Vui lòng kiểm tra URL hoặc props.");
      return;
    }
    fetchColumns();
    fetchBoardMembers();
  }, [boardId, refreshKey, fetchColumns, fetchBoardMembers]);

  // Xử lý Socket.IO events
  useEffect(() => {
    if (!socket || !socketReady) {
      console.warn("Socket not available or not ready in ListColumns");
      return;
    }

    const handleConnect = () => {
      console.log("ListColumns: Socket connected");
      if (boardId) {
        socket.emit("join-board", { boardId });
      }
    };

    const handleConnectError = (err) => {
      console.error("ListColumns: Socket error:", err.message);
      toast.error("Lỗi kết nối server!");
    };

    const handleListCreated = ({ boardId: updatedBoardId, list }) => {
      if (updatedBoardId === boardId) {
        setColumns((prev) => [
          ...prev,
          { ...list, cards: [], isExpanded: true },
        ]);
        toast.info("Một cột mới đã được thêm!");
      }
    };

    const handleListDeleted = ({ boardId: updatedBoardId, listId }) => {
      if (updatedBoardId === boardId) {
        setColumns((prev) => prev.filter((col) => col._id !== listId));
        toast.info("Một cột đã bị xóa!");
      }
    };

    const handleListOrderUpdated = ({
      boardId: updatedBoardId,
      columnOrder,
    }) => {
      if (updatedBoardId === boardId) {
        setColumns((prevColumns) => {
          const reorderedColumns = columnOrder
            .map((id) => prevColumns.find((col) => col._id === id))
            .filter((col) => col);
          return reorderedColumns;
        });
        toast.info("Thứ tự cột đã được cập nhật!");
      }
    };

    const handleCardCreated = ({ boardId: updatedBoardId, listId, card }) => {
      if (updatedBoardId === boardId) {
        setColumns((prevColumns) => {
          const newColumns = [...prevColumns];
          const targetColumn = newColumns.find((col) => col._id === listId);
          if (targetColumn) {
            targetColumn.cards.push(card);
          }
          return newColumns;
        });
        toast.info("Một thẻ mới đã được thêm!");
      }
    };

    const handleCardDeleted = ({ boardId: updatedBoardId, listId, cardId }) => {
      if (updatedBoardId === boardId) {
        setColumns((prevColumns) => {
          const newColumns = [...prevColumns];
          const targetColumn = newColumns.find((col) => col._id === listId);
          if (targetColumn) {
            targetColumn.cards = targetColumn.cards.filter(
              (card) => card._id !== cardId
            );
          }
          return newColumns;
        });
        toast.info("Một thẻ đã bị xóa!");
      }
    };

    const handleCardMoved = ({ card, oldListId, newListId, newPosition }) => {
      if (card.board === boardId) {
        setColumns((prevColumns) => {
          const newColumns = [...prevColumns];
          const oldColumn = newColumns.find((c) => c._id === oldListId);
          const newColumn = newColumns.find((c) => c._id === newListId);

          if (oldColumn) {
            oldColumn.cards = oldColumn.cards.filter((c) => c._id !== card._id);
          }
          if (newColumn) {
            newColumn.cards.splice(newPosition, 0, {
              ...card,
              list: newListId,
            });
          }

          return newColumns;
        });
        toast.info("Một thẻ đã được di chuyển!");
      }
    };

    const handleCardOrderUpdated = ({ listId, cardOrder }) => {
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const targetColumn = newColumns.find((c) => c._id === listId);
        if (targetColumn) {
          targetColumn.cards = cardOrder
            .map((id) => targetColumn.cards.find((card) => card._id === id))
            .filter((card) => card);
        }
        return newColumns;
      });
      toast.info("Thứ tự thẻ đã được cập nhật!");
    };

    const handleMemberDeactivated = (data) => {
      if (data.deactivatedUserId === localStorage.getItem("userId")) {
        if (data.boardId === boardId) {
          toast.info("Bạn đã bị xóa khỏi bảng này!");
          setColumns([]);
          setBoardMembers([]);
        }
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
      console.log("ListColumns: Received member-invited:", {
        board,
        invitedUser,
      });
      setBoardMembers(board.members || []);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("list-created", handleListCreated);
    socket.on("list-deleted", handleListDeleted);
    socket.on("list-order-updated", handleListOrderUpdated);
    socket.on("card-created", handleCardCreated);
    socket.on("card-deleted", handleCardDeleted);
    socket.on("card-moved", handleCardMoved);
    socket.on("card-order-updated", handleCardOrderUpdated);
    socket.on("member-deactivated", handleMemberDeactivated);
    socket.on("member-invited", handleMemberInvited);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("list-created", handleListCreated);
      socket.off("list-deleted", handleListDeleted);
      socket.off("list-order-updated", handleListOrderUpdated);
      socket.off("card-created", handleCardCreated);
      socket.off("card-deleted", handleCardDeleted);
      socket.off("card-moved", handleCardMoved);
      socket.off("card-order-updated", handleCardOrderUpdated);
      socket.off("member-deactivated", handleMemberDeactivated);
      socket.off("member-invited", handleMemberInvited);
    };
  }, [boardId, socket, socketReady]);

  // Tạo cột mới
  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) {
      toast.error("Tiêu đề cột không được để trống!");
      return;
    }

    if (!boardId) {
      toast.error("Không tìm thấy boardId! Vui lòng kiểm tra lại.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/lists",
        {
          title: newColumnTitle,
          board: boardId,
          position: columns.length,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setColumns([
        ...columns,
        { ...response.data, cards: [], isExpanded: true },
      ]);
      if (socket && socketReady) {
        socket.emit("list-created", {
          boardId,
          list: response.data,
        });
        console.log("Emitted list-created:", { boardId, list: response.data });
      }
      setOpenCreateColumnDialog(false);
      setNewColumnTitle("");
      toast.success("Tạo cột thành công!");
    } catch (err) {
      console.error("Error creating column:", {
        message: err.message,
        response: err.response?.data,
      });
      toast.error(
        `Có lỗi xảy ra khi tạo cột: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  // Xử lý kéo thả
  const handleDragStart = (event) => {
    setActiveDragItem({
      id: event.active.id,
      type: event.active.data.current?.type,
      data: event.active.data.current,
    });
    console.log("Drag started:", {
      type: event.active.data.current?.type,
      id: event.active.id,
      title:
        event.active.data.current?.title ||
        event.active.data.current?.card?.title,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDragEnd = useCallback(
    async (event) => {
      setActiveDragItem(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (active.data.current?.type === "Column") {
        const oldIndex = columns.findIndex((c) => c._id === active.id);
        const newIndex = columns.findIndex((c) => c._id === over.id);
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
          }
          const columnOrder = newColumns.map((column) => column._id);
          console.log("Sending columnOrder to server:", {
            boardId,
            columnOrder: JSON.stringify(columnOrder),
            timestamp: new Date().toISOString(),
          });
          const response = await axios.put(
            `http://localhost:5000/api/lists/board/${boardId}/list-order`,
            { columnOrder },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("Update list order response:", response.data);

          if (socket && socketReady) {
            socket.emit("list-order-updated", {
              boardId,
              columnOrder,
            });
            console.log("Emitted list-order-updated:", {
              boardId,
              columnOrder,
            });
          }
          toast.success("Cập nhật thứ tự cột thành công!");
        } catch (err) {
          console.error("Error updating column order:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          toast.error(
            `Có lỗi khi cập nhật thứ tự cột: ${
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
        } else if (over.data.current?.type === "Column") {
          overColumnId = over.id;
        } else {
          console.error("Không xác định được cột đích!");
          return;
        }

        const activeColumnIndex = columns.findIndex(
          (c) => c._id === activeColumnId
        );
        const overColumnIndex = columns.findIndex(
          (c) => c._id === overColumnId
        );

        if (activeColumnIndex === -1 || overColumnIndex === -1) {
          console.error("Không tìm thấy cột nguồn hoặc cột đích!");
          return;
        }

        const activeCard = columns[activeColumnIndex].cards.find(
          (c) => c._id === activeCardId
        );
        if (!activeCard) {
          console.error("Không tìm thấy thẻ nguồn!");
          return;
        }

        const newColumns = [...columns];
        newColumns[activeColumnIndex].cards = newColumns[
          activeColumnIndex
        ].cards.filter((c) => c._id !== activeCardId);
        const updatedCard = { ...activeCard, list: overColumnId };

        let insertIndex = 0;
        if (overCardId) {
          insertIndex = newColumns[overColumnIndex].cards.findIndex(
            (c) => c._id === overCardId
          );
          if (
            activeColumnId === overColumnId &&
            newColumns[overColumnIndex].cards[insertIndex]._id === activeCardId
          ) {
            insertIndex++;
          }
        }
        newColumns[overColumnIndex].cards.splice(insertIndex, 0, updatedCard);

        setColumns(newColumns);

        try {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
          }
          await axios.put(
            `http://localhost:5000/api/cards/${activeCardId}/move`,
            { newListId: overColumnId, newBoardId: boardId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          await Promise.all([
            axios.put(
              `http://localhost:5000/api/lists/card-order/${activeColumnId}`,
              {
                cardOrder: newColumns[activeColumnIndex].cards.map(
                  (c) => c._id
                ),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            ),
            axios.put(
              `http://localhost:5000/api/lists/card-order/${overColumnId}`,
              {
                cardOrder: newColumns[overColumnIndex].cards.map((c) => c._id),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            ),
          ]);

          if (socket && socketReady) {
            socket.emit("card-moved", {
              card: updatedCard,
              oldListId: activeColumnId,
              newListId: overColumnId,
              newPosition: insertIndex,
            });
            socket.emit("card-order-updated", {
              listId: activeColumnId,
              cardOrder: newColumns[activeColumnIndex].cards.map((c) => c._id),
            });
            socket.emit("card-order-updated", {
              listId: overColumnId,
              cardOrder: newColumns[overColumnIndex].cards.map((c) => c._id),
            });
            console.log("Emitted card-moved:", {
              cardId: updatedCard._id,
              oldListId: activeColumnId,
              newListId: overColumnId,
              newPosition: insertIndex,
            });
          }
          toast.success("Di chuyển thẻ thành công!");
        } catch (err) {
          console.error("Error moving card:", {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          toast.error(
            `Có lỗi khi di chuyển thẻ: ${
              err.response?.data?.message || err.message
            }`
          );
          fetchColumns();
        }
      }
    },
    [columns, boardId, socket, socketReady, fetchColumns]
  );

  const sortableItems = [
    ...columns.map((c) => ({ id: c._id, type: "Column" })),
    ...columns.flatMap((c) =>
      c.cards.map((card) => ({ id: card._id, type: "Card", list: c._id }))
    ),
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
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
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                initialExpanded={column.isExpanded ?? true}
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

        <DragOverlay>
          {activeDragItem?.type === "Column" && (
            <Box
              sx={{
                bgcolor: isDarkMode ? "#2a2a3d" : "#f4f5f7",
                borderRadius: "12px",
                boxShadow: isDarkMode
                  ? "0 6px 16px rgba(0,0,0,0.5)"
                  : theme.shadows[5],
                opacity: 0.9,
                transform: "scale(1.05)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                cursor: "grabbing",
                minWidth: "300px",
                maxWidth: "300px",
                height: activeDragItem.data.isExpanded ? "fit-content" : "56px",
                maxHeight: activeDragItem.data.isExpanded
                  ? `calc(100vh - 100px)`
                  : "56px",
              }}
            >
              <Column
                column={activeDragItem.data}
                setColumns={setColumns}
                boardId={boardId}
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
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
                  ? "0 6px 16px rgba(0,0,0,0.5)"
                  : theme.shadows[5],
                opacity: 0.9,
                transform: "scale(1.05)",
                transition: "transform 0.2s ease, opacity 0.2s ease",
                p: 2,
                cursor: "grabbing",
                border: activeDragItem.data.card.completed
                  ? `2px solid ${theme.palette.success.main}`
                  : `1px solid ${theme.palette.divider}`,
                height: "120px",
                width: "100%",
                maxWidth: "300px",
              }}
            >
              <Cards
                card={activeDragItem.data.card}
                setCards={() => {}}
                setColumns={setColumns}
                boardMembers={boardMembers}
                setBoardMembers={setBoardMembers}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </Box>
          )}
        </DragOverlay>
      </SortableContext>
    </DndContext>
  );
}

export default ListColumns;

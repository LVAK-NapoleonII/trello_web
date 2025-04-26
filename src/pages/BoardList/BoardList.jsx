import { useState, useEffect, useContext } from "react";
import { Box } from "@mui/material";
import BoardItem from "./BoardItem/BoardItem";
import { SocketContext } from "../../context/SocketContext";

const BoardList = ({
  boards: initialBoards,
  searchValue,
  onUpdate,
  onDelete,
}) => {
  const { socket, socketReady } = useContext(SocketContext); // Use socket and socketReady
  const [boards, setBoards] = useState(initialBoards);

  useEffect(() => {
    if (!socket || !socketReady) {
      console.warn("Socket not available or not ready in BoardList");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("join", userId);
      console.log("BoardList tham gia phòng socket:", userId);
    }

    setBoards(initialBoards);

    const handleBoardCreated = (data) => {
      console.log("Nhận board-created:", data);
      setBoards((prevBoards) => {
        if (!prevBoards.some((b) => b._id === data.board._id)) {
          return [...prevBoards, data.board];
        }
        return prevBoards;
      });
      onUpdate(data.board);
    };

    const handleBoardUpdated = (data) => {
      console.log("Nhận boardUpdated:", data);
      setBoards((prevBoards) =>
        prevBoards.map((board) => (board._id === data._id ? data : board))
      );
      onUpdate(data);
    };

    const handleBoardDeleted = (data) => {
      console.log("Nhận board-deleted:", data);
      setBoards((prevBoards) =>
        prevBoards.filter((board) => board._id !== data.boardId)
      );
      onDelete(data.boardId);
    };

    socket.on("board-created", handleBoardCreated);
    socket.on("boardUpdated", handleBoardUpdated);
    socket.on("board-deleted", handleBoardDeleted);

    return () => {
      socket.off("board-created", handleBoardCreated);
      socket.off("boardUpdated", handleBoardUpdated);
      socket.off("board-deleted", handleBoardDeleted);
    };
  }, [initialBoards, onUpdate, onDelete, socket, socketReady]);

  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 3,
      }}
    >
      {filteredBoards.map((board) => (
        <BoardItem
          key={board._id}
          board={board}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
};

export default BoardList;

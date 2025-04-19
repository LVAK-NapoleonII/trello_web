import { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoardContent/BoardContent";
import Takenotes from "../Takenotes/Takenotes.jsx";
import axios from "axios";
import { useParams } from "react-router-dom";

function Board() {
  const { boardId } = useParams(); // Lấy boardId từ URL
  const [notesList, setNotesList] = useState([]); // Danh sách TakeNotes
  const [loading, setLoading] = useState(true); // Trạng thái loading dữ liệu bảng
  const [board, setBoard] = useState(null); // Dữ liệu bảng
  const theme = useTheme(); // Lấy theme để kiểm tra chế độ light/dark
  const isDarkMode = theme.palette.mode === "dark";

  // Tải dữ liệu bảng từ API
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Không tìm thấy token! Vui lòng đăng nhập lại.");
        }

        console.log("Board: Fetching board with ID:", boardId);
        const response = await axios.get(
          `http://localhost:5000/api/boards/${boardId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const boardData = response.data;
        console.log("Board: Fetched board data:", boardData);

        // Tải danh sách cột
        const columnsResponse = await axios.get(
          `http://localhost:5000/api/lists/board/${boardId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Board: Fetched columns:", columnsResponse.data);

        const columnsWithCards = await Promise.all(
          columnsResponse.data.map(async (column) => {
            const cardsResponse = await axios.get(
              `http://localhost:5000/api/cards/list/${column._id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...column, cards: cardsResponse.data };
          })
        );

        setBoard({
          ...boardData,
          columns: columnsWithCards,
          columnOrderIds: columnsWithCards.map((col) => col._id),
        });
        setLoading(false);
      } catch (err) {
        console.error(
          "Board: Error fetching board:",
          err.response?.data || err.message
        );
        alert(
          `Có lỗi xảy ra khi tải bảng: ${
            err.response?.data?.message || err.message
          }`
        );
        setLoading(false);
      }
    };

    if (boardId) {
      fetchBoard();
    } else {
      console.warn("Board: No boardId provided");
      setLoading(false);
    }
  }, [boardId]);

  // Khi nhấn chuột phải, thêm một TakeNotes mới
  const handleRightClick = (event) => {
    event.preventDefault();

    const newNote = {
      id: Date.now(),
      position: { x: event.clientX, y: event.clientY },
      notes: [],
      isAdding: true,
    };

    setNotesList((prev) => [...prev, newNote]);

    setTimeout(() => {
      setNotesList((prev) =>
        prev.map((note) =>
          note.id === newNote.id ? { ...note, isAdding: false } : note
        )
      );
    }, 500);
  };

  // Xóa một TakeNotes
  const deleteTakeNote = (id) => {
    setNotesList(notesList.filter((note) => note.id !== id));
  };

  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{
        height: "100vh",
        backgroundColor: isDarkMode ? "#000000" : "#FFFFFF", // Màu đen cho dark, trắng cho light
      }}
      onContextMenu={handleRightClick}
    >
      {loading || !board ? (
        <Container
          sx={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={50} />
        </Container>
      ) : (
        <>
          <BoardBar board={board} setBoard={setBoard} />
          <BoardContent board={board} />
          {/* Render nhiều TakeNotes */}
          {notesList.map((noteItem) => (
            <Takenotes
              key={noteItem.id}
              position={noteItem.position}
              notes={noteItem.notes}
              onAddNote={(text) => {
                setNotesList((prevNotesList) =>
                  prevNotesList.map((note) =>
                    note.id === noteItem.id
                      ? {
                          ...note,
                          notes: [...note.notes, { id: Date.now(), text }],
                        }
                      : note
                  )
                );
              }}
              onDeleteNote={(noteId) => {
                setNotesList((prevNotesList) =>
                  prevNotesList.map((note) =>
                    note.id === noteItem.id
                      ? {
                          ...note,
                          notes: note.notes.filter((n) => n.id !== noteId),
                        }
                      : note
                  )
                );
              }}
              onClose={() => deleteTakeNote(noteItem.id)}
              sx={{
                opacity: noteItem.isAdding ? 0.5 : 1,
                transition: "opacity 0.5s ease-in-out",
              }}
            />
          ))}
        </>
      )}
    </Container>
  );
}

export default Board;

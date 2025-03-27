import { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import AppBar from "../../components/AppBar/AppBar";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoardContent/BoardContent";
import { mockData } from "../../apis/mock-data";
import Takenotes from "../Takenotes/Takenotes.jsx";

function Board() {
  const [notesList, setNotesList] = useState([]); // Danh sách TakeNotes
  const [loading, setLoading] = useState(true); // ✅ Trạng thái loading dữ liệu bảng

  // ✅ Giả lập hiệu ứng tải bảng (Giả lập API)
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Giả lập thời gian tải
  }, []);

  // Khi nhấn chuột phải, thêm một TakeNotes mới
  const handleRightClick = (event) => {
    event.preventDefault();

    const newNote = {
      id: Date.now(),
      position: { x: event.clientX, y: event.clientY },
      notes: [],
      isAdding: true, // ✅ Thêm trạng thái đang thêm
    };

    setNotesList((prev) => [...prev, newNote]);

    // ✅ Sau 500ms thì bỏ trạng thái loading
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
      sx={{ height: "100vh", backgroundColor: "primary.main" }}
      onContextMenu={handleRightClick} // Lắng nghe sự kiện nhấn chuột phải
    >
      {/* ✅ Loading khi tải dữ liệu bảng */}
      {loading ? (
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
          <BoardBar board={mockData.board} />
          <BoardContent board={mockData.board} />

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
                opacity: noteItem.isAdding ? 0.5 : 1, // ✅ Làm mờ khi đang thêm
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

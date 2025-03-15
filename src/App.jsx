import { useState } from "react";
import Board from "./pages/Boards/_id";
import Takenotes from "./pages/Takenotes/Takenotes";

function App() {
  const [notesList, setNotesList] = useState([]); // Danh sách các TakeNotes

  // Khi nhấn chuột phải, thêm một TakeNotes mới
  const handleRightClick = (event) => {
    event.preventDefault();

    const newNote = {
      id: Date.now(), // ID duy nhất
      position: { x: event.clientX, y: event.clientY },
      notes: [], // Danh sách ghi chú trong TakeNotes này
    };

    setNotesList([...notesList, newNote]); // Thêm TakeNotes mới vào danh sách
  };

  // Xóa một TakeNotes
  const deleteTakeNote = (id) => {
    setNotesList(notesList.filter((note) => note.id !== id));
  };

  return (
    <div onContextMenu={handleRightClick} style={{ height: "100vh" }}>
      <Board />

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
          onClose={() => deleteTakeNote(noteItem.id)} // Đóng TakeNotes này
        />
      ))}
    </div>
  );
}

export default App;

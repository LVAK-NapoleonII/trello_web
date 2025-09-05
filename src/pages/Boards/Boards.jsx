import { useState, useEffect, useContext } from "react";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import BoardBar from "./BoardBar/BoardBar";
import BoardContent from "./BoardContent/BoardContent";
import Takenotes from "../Takenotes/Takenotes.jsx";
import axios from "axios";
import { useParams } from "react-router-dom";
import { SocketContext } from "../../context/SocketContext";

function Board() {
  const { boardId } = useParams();
  const { socket, socketReady } = useContext(SocketContext);
  const [notesList, setNotesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState(null);
  const [boardMembers, setBoardMembers] = useState([]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Hàm lọc bỏ các thành viên trùng lặp, ưu tiên bản ghi không hoạt động
  const filterUniqueMembers = (members) => {
    if (!Array.isArray(members)) {
      console.warn("filterUniqueMembers: Invalid members array", members);
      return [];
    }
    const uniqueMembers = members.reduce((acc, member) => {
      const memberId = member.user?._id || member._id;
      const existingMember = acc.find(
        (m) => (m.user?._id || m._id).toString() === memberId.toString()
      );
      if (!existingMember) {
        acc.push(member);
      } else if (member.isActive === false) {
        // Thay thế bằng bản ghi không hoạt động nếu có
        acc = acc.filter(
          (m) => (m.user?._id || m._id).toString() !== memberId.toString()
        );
        acc.push(member);
      }
      return acc;
    }, []);
    console.log(
      "filterUniqueMembers: Result:",
      JSON.stringify(uniqueMembers, null, 2)
    );
    return uniqueMembers;
  };

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
        console.log(
          "Board: Fetched board data:",
          JSON.stringify(boardData, null, 2)
        );

        // Tải danh sách cột
        const columnsResponse = await axios.get(
          `http://localhost:5000/api/lists/board/${boardId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(
          "Board: Fetched columns:",
          JSON.stringify(columnsResponse.data, null, 2)
        );

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
        // Lọc bỏ thành viên trùng lặp trước khi setBoardMembers
        const uniqueMembers = filterUniqueMembers(boardData.members || []);
        setBoardMembers(uniqueMembers);
        setLoading(false);
      } catch (err) {
        console.error(
          "Board: Error fetching board:",
          err.response?.data || err.message
        );
        alert(
          `Có lỗi xảy ra khi tải bảng: ${err.response?.data?.message || err.message
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

  // Tham gia phòng socket khi socket sẵn sàng
  useEffect(() => {
    if (!socket || !socketReady || !boardId) return;

    socket.emit("join-board", { boardId });
    console.log("Board: Joined board room:", boardId);

    // Lắng nghe sự kiện board-updated để đồng bộ boardMembers
    socket.on("board-updated", (data) => {
      console.log(
        "Board: Received board-updated:",
        JSON.stringify(data, null, 2)
      );
      setBoard(data.board);
      // Lọc bỏ thành viên trùng lặp trước khi cập nhật
      const uniqueMembers = filterUniqueMembers(data.board.members || []);
      setBoardMembers(uniqueMembers);
    });

    return () => {
      socket.off("connect");
      socket.off("board-updated");
    };
  }, [socket, socketReady, boardId]);

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
        backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
        overflow: "hidden",  // Ngăn khoảng trắng dư khi scroll
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
          <BoardBar
            board={board}
            setBoard={(newBoard) => {
              setBoard(newBoard);
              // Lọc bỏ thành viên trùng lặp khi BoardBar cập nhật board
              const uniqueMembers = filterUniqueMembers(newBoard.members || []);
              setBoardMembers(uniqueMembers);
            }}
          />
          <BoardContent
            board={board}
            boardMembers={boardMembers}
            setBoardMembers={(newMembers) => {
              // Lọc bỏ thành viên trùng lặp khi BoardContent cập nhật boardMembers
              const uniqueMembers = filterUniqueMembers(newMembers || []);
              setBoardMembers(uniqueMembers);
            }}
          />
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
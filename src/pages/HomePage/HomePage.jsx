import { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import BoardList from "../BoardList/BoardList";
import Sidebar from "./Sidebar/Sidebar"; // Đảm bảo đường dẫn Sidebar đúng

// Hàm tạo màu gradient ngẫu nhiên
const generateGradient = () => {
  const colors = [
    ["#ff6b6b", "#feca57"],
    ["#6b6bff", "#1dd1a1"],
    ["#0984e3", "#d980fa"],
    ["#ff9ff3", "#feca57"],
    ["#48dbfb", "#1dd1a1"],
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return `linear-gradient(135deg, ${colors[randomIndex][0]}, ${colors[randomIndex][1]})`;
};

const HomePage = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const getStoredBgGradient = () =>
    localStorage.getItem("bgGradient") || generateGradient();

  const [searchValue, setSearchValue] = useState("");
  const [boards, setBoards] = useState([
    { id: 1, name: "Project A", color: "#ff6b6b" },
    { id: 2, name: "Marketing Plan", color: "#6b6bff" },
    { id: 3, name: "Sprint Backlog", color: "#feca57" },
    { id: 4, name: "Personal Tasks", color: "#1dd1a1" },
  ]);
  const [bgGradient, setBgGradient] = useState(getStoredBgGradient);

  useEffect(() => {
    localStorage.setItem("bgGradient", bgGradient);
  }, [bgGradient]);

  const handleCreateBoard = () => {
    const newBoard = {
      id: boards.length + 1,
      name: `New Board ${boards.length + 1}`,
      color: generateGradient(),
    };
    setBoards([...boards, newBoard]);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", p: 1 }}>
      {/* Nội dung chính */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "center",
          p: 3,
          background: bgGradient,
          transition: "background 1s ease",
          borderRadius: "20px",
          boxShadow: "0px 8px 16px rgba(0,0,0,0.2)",
        }}
      >
        {/* Sidebar bên trái */}
        <Box
          sx={{
            width: "250px",
            flexShrink: 0,
            mr: 2,
          }}
        >
          <Sidebar />
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            height: "calc(100vh )",
            overflowY: "auto",
            backdropFilter: "blur(10px)",
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(255, 255, 255, 0.6)",
            borderRadius: 4,
            padding: 4,
            boxShadow: isDarkMode
              ? "0px 8px 16px rgba(0, 0, 0, 0.5)"
              : "0px 8px 16px rgba(0, 0, 0, 0.2)",
            transition: "all 0.5s ease",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ mb: 3, color: isDarkMode ? "#fff" : "#333" }}
          >
            My Boards
          </Typography>

          {/* Chọn màu nền */}
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
            <Typography
              variant="body1"
              sx={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              Chọn màu nền:
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setBgGradient(generateGradient())}
              sx={{
                color: isDarkMode ? "#fff" : "#333",
                borderColor: isDarkMode ? "#fff" : "#333",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
              }}
            >
              Random Gradient
            </Button>
          </Box>

          {/* Tìm kiếm & Tạo board mới */}
          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search boards..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon
                    sx={{ mr: 1, color: isDarkMode ? "#ccc" : "gray" }}
                  />
                ),
              }}
              sx={{
                width: "300px",
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(255, 255, 255, 0.8)",
                borderRadius: 2,
                color: isDarkMode ? "#fff" : "#000",
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateBoard}
              sx={{
                bgcolor: isDarkMode ? "#673ab7" : "primary.main",
                color: "white",
                transition: "0.3s",
                "&:hover": {
                  bgcolor: isDarkMode ? "#512da8" : "secondary.main",
                  transform: "scale(1.05)",
                },
              }}
            >
              Create Board
            </Button>
          </Box>

          {/* Danh sách boards */}
          <BoardList boards={boards} searchValue={searchValue} />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;

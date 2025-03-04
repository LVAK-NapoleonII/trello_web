import Box from "@mui/material/Box";
import ListColumns from "./ListColumns/ListColumns";
import { DndContext } from "@dnd-kit/core";
function BoardContent(board) {
  const handleDragEnd = (event) => {
    console.log(event.target);
  };
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Box
        sx={{
          width: "100%",
          height: (theme) => theme.trelloCustom.boardContentHeight,
          display: "flex",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
          p: "10px 0",
        }}
      >
        <ListColumns columns={board?.columns} />
      </Box>
    </DndContext>
  );
}

export default BoardContent;

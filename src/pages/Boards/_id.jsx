import Container from "@mui/material/Container";
import AppBar from "../../components/AppBar/index";
import BoardBar from "./BoardBar/index";
import BoardContent from "./BoardContent/index";
function Board() {
  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ height: "100vh", backgroundColor: "primary.main" }}
    >
      <AppBar />
      <BoardBar />
      <BoardContent />
    </Container>
  );
}

export default Board;

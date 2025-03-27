import { Grid } from "@mui/material";
import BoardItem from "./BoardItem/BoardItem";

const BoardList = ({ boards }) => {
  return (
    <Grid container spacing={2}>
      {boards.map((board) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={board._id}>
          <BoardItem board={board} />
        </Grid>
      ))}
    </Grid>
  );
};

export default BoardList;

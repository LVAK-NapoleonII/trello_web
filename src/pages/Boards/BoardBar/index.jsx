import Box from "@mui/material/Box";

function BoardBar() {
  return (
    <Box
      sx={{
        backgroundColor: "primary.dark",
        width: "100%",
        height: (theme) => theme.trelloCustom.boarBarHeight,
        display: "flex",
        alightItem: "center",
      }}
    >
      Board bar
    </Box>
  );
}

export default BoardBar;

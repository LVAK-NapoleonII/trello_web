import { useState } from "react";
import ModeSelect from "../ModeSelect";
import Box from "@mui/material/Box";
import AppsIcon from "@mui/icons-material/Apps";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import { Tooltip, Typography } from "@mui/material";
import WorkSpace from "./Menus/WorkSpace";
import Recents from "./Menus/Recents";
import Starred from "./Menus/Starred";
import Templates from "./Menus/Templates";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HelpIcon from "@mui/icons-material/Help";
import Profiles from "./Menus/Profiles";
import AddToPhotosIcon from "@mui/icons-material/AddToPhotos";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

function AppBar() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <Box
      px={2}
      sx={{
        backgroundColor: "primary.contrastText",
        width: "100%",
        height: (theme) => theme.trelloCustom.appBarHeight,
        display: "flex",
        alightItem: "center",
        justifyContent: "space-between",
        gap: 2,
        overflowX: "auto",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#2c3e50" : "#1565c0",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <AppsIcon sx={{ color: "white" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BackupTableIcon sx={{ color: "white" }} />
          <Typography
            variant="span"
            sx={{
              fontSize: "1.2 rem",
              fontWeight: "bold",
              color: "white",
            }}
          >
            Trello
          </Typography>
        </Box>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <WorkSpace />
          <Recents />
          <Starred />
          <Templates />
          <Button
            variant="outlined"
            sx={{
              fontWeight: "bold",
              color: "white",
              border: "none",
              "&:hover": { border: "none" },
            }}
            startIcon={<AddToPhotosIcon />}
          >
            Creacte
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {" "}
        <TextField
          id="outlined-search"
          label="Search ..."
          type="text"
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <Tooltip title="Search in Trello">
                <SearchIcon sx={{ fontSize: "1.2rem", color: "white" }} />
              </Tooltip>
            ),
            endAdornment: (
              <Tooltip title="Clear Search">
                <ClearIcon
                  sx={{
                    fontSize: "1.2rem",
                    color: searchValue ? "white" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setSearchValue("")}
                />
              </Tooltip>
            ),
          }}
          sx={{
            minWidth: "120px",
            maxWidth: "180px",
            "& label": { color: "white" },
            "& input": { color: "white" },
            "& label.Mui-focused": { color: "white" },
            "& .MuiOutlinedInout-root": {
              "& fieldset": { borderColor: "white" },
              "&:hover fieldset": { borderColor: "white" },
              "&.MuiOutlinedInput-input": { color: "white" },
              "&.MuiOutlinedInput-root-focused .MuiOutlinedInput-input": {
                color: "white",
              },
              "&.MuiOutlinedInput-input::placeholder": { color: "white" },
              "&.MuiOutlinedInput-root-focused.MuiOutlinedInput-input::placeholder":
                {
                  color: "white",
                },
            },
          }}
        />
        <ModeSelect />
        <Tooltip title="Notifications">
          <Badge
            color="warning"
            variant="dot"
            sx={{ cursor: "pointer", color: "white" }}
          >
            <NotificationsIcon />
          </Badge>
        </Tooltip>
        <Tooltip title="Helps" sx={{ cursor: "pointer", color: "white" }}>
          <HelpIcon />
        </Tooltip>
        <Tooltip title="profiles" sx={{ cursor: "pointer", color: "white" }}>
          <Profiles />
        </Tooltip>
      </Box>
    </Box>
  );
}

export default AppBar;

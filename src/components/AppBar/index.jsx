import ModeSelect from "../../components/ModeSelect";
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
function AppBar() {
  return (
    <Box
      sx={{
        backgroundColor: "primary.contrastText",
        width: "100%",
        height: (theme) => theme.trelloCustom.appBarHeight,
        display: "flex",
        alightItem: "center",
        justifyContent: "space-between",
        gap: 2,
        overflowX: "auto",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <AppsIcon sx={{ color: "primary.main" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BackupTableIcon sx={{ color: "primary.main" }} />
          <Typography
            variant="span"
            sx={{
              fontSize: "1.2 rem",
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
            Trello
          </Typography>
        </Box>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          <WorkSpace variant="span" />
          <Recents variant="span" />
          <Starred variant="span" />
          <Templates variant="span" />
          <Button variant="outlined" sx={{ fontWeight: "bold" }}>
            Creact
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {" "}
        <TextField
          id="outlined-search"
          label="Search ..."
          type="search"
          size="small"
          sx={{ minWidth: "120px" }}
        />
        <ModeSelect />
        <Tooltip title="Notifications">
          <Badge color="secondary" variant="dot" sx={{ cursor: "pointer" }}>
            <NotificationsIcon />
          </Badge>
        </Tooltip>
        <Tooltip title="Helps" sx={{ cursor: "pointer" }}>
          <HelpIcon />
        </Tooltip>
        <Tooltip title="Helps" sx={{ cursor: "pointer" }}>
          <Profiles />
        </Tooltip>
      </Box>
    </Box>
  );
}

export default AppBar;

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import BoltIcon from "@mui/icons-material/Bolt";
import FilterListIcon from "@mui/icons-material/FilterList";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import { Tooltip } from "@mui/material";
import Button from "@mui/material/Button";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const menuStype = {
  color: "white",
  bgcolor: "transparent",
  border: "none",
  paddingX: "5px",
  borderRadius: "5px",
  ".MuiSvgIcon-root": {
    color: "white",
  },
  "&:hover": {
    backgroundColor: "primary.50",
  },
};

function BoardBar() {
  return (
    <Box
      px={2}
      sx={{
        backgroundColor: "white",
        width: "100%",
        height: (theme) => theme.trelloCustom.boarBarHeight,
        display: "flex",
        alightItem: "center",
        justifyContent: "space-between",
        gap: 2,
        overflowX: "auto",
        borderTop: "1px solid white",
        borderBottom: "1px solid white",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Chip
          sx={menuStype}
          icon={<DashboardIcon />}
          label="LVAK"
          //onclick={() => {}}
          clickable={true}
        />
        <Chip
          sx={menuStype}
          icon={<VpnLockIcon />}
          label="Public/private workspace"
          //onclick={() => {}}
          clickable={true}
        />
        <Chip
          sx={menuStype}
          icon={<AddToDriveIcon />}
          label="Add to google drive"
          //onclick={() => {}}
          clickable={true}
        />
        <Chip
          sx={menuStype}
          icon={<BoltIcon />}
          label="automation"
          //onclick={() => {}}
          clickable={true}
        />
        <Chip
          sx={menuStype}
          icon={<FilterListIcon />}
          label="Filters"
          //onclick={() => {}}
          clickable={true}
        />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button
          variant="outlined"
          sx={{
            fontWeight: "bold",
            color: "white",
            borderColor: "white",
            "&:hover": { borderColor: "white" },
          }}
          startIcon={<PersonAddIcon />}
        >
          invite
        </Button>
        <AvatarGroup
          max={4}
          sx={{
            gap: "10px",
            "& .MuiAvatar-root": {
              width: "30px",
              height: "30px",
              fontSize: "16px",
              border: "none",
              color: "white",
              cursor: "pointer",
              "&:first-of-type": { bgcolor: "#a4b0be" },
            },
          }}
        >
          <Tooltip title="lvak">
            <Avatar alt="LVAK" src="/static/images/avatar/1.jpg" />
          </Tooltip>
        </AvatarGroup>
      </Box>
    </Box>
  );
}

export default BoardBar;

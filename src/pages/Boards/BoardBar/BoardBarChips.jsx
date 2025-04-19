import { Box, Chip, Tooltip, useTheme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import AddToDriveIcon from "@mui/icons-material/AddToDrive";
import BoltIcon from "@mui/icons-material/Bolt";
import FilterListIcon from "@mui/icons-material/FilterList";

function BoardBarChips({
  board,
  handleAddToGoogleDrive,
  handleAutomation,
  handleFilters,
}) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const chipStyle = {
    bgcolor: isDarkMode
      ? theme.palette.background.paper
      : "rgba(255, 255, 255, 0.9)",
    color: theme.palette.text.primary,
    fontWeight: "medium",
    transition: "all 0.2s ease",
    "&:hover": {
      bgcolor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
      transform: "scale(1.05)",
    },
    ".MuiSvgIcon-root": {
      color: theme.palette.text.secondary,
    },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: { xs: 1, sm: 1.5 },
      }}
    >
      <Tooltip title="Tên bảng">
        <Chip
          sx={chipStyle}
          icon={<DashboardIcon />}
          label={board.title || "Board Title"}
          clickable
        />
      </Tooltip>
      <Tooltip title="Loại bảng">
        <Chip
          sx={chipStyle}
          icon={<VpnLockIcon />}
          label={board.visibility === "public" ? "Công khai" : "Riêng tư"}
          clickable
        />
      </Tooltip>
      <Tooltip title="Thêm vào Google Drive">
        <Chip
          sx={chipStyle}
          icon={<AddToDriveIcon />}
          label="Google Drive"
          onClick={handleAddToGoogleDrive}
          clickable
        />
      </Tooltip>
      <Tooltip title="Tự động hóa">
        <Chip
          sx={chipStyle}
          icon={<BoltIcon />}
          label="Automation"
          onClick={handleAutomation}
          clickable
        />
      </Tooltip>
      <Tooltip title="Lọc thẻ">
        <Chip
          sx={chipStyle}
          icon={<FilterListIcon />}
          label="Filters"
          onClick={handleFilters}
          clickable
        />
      </Tooltip>
    </Box>
  );
}

export default BoardBarChips;

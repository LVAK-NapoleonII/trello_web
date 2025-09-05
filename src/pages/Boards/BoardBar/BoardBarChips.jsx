import { Box, Chip, Tooltip, useTheme, Typography, Fade } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import VpnLockIcon from "@mui/icons-material/VpnLock";
import PublicIcon from "@mui/icons-material/Public";
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

  const chipBaseStyle = {
    fontWeight: 500,
    fontSize: "0.85rem",
    borderRadius: 10,
    padding: "6px 12px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backdropFilter: "blur(12px)",
    border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
    "& .MuiChip-icon": {
      fontSize: 18,
      transition: "all 0.3s ease",
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: `0 6px 20px ${isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)"}`,
    },
  };

  const titleChipStyle = {
    ...chipBaseStyle,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      ...chipBaseStyle["&:hover"],
      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
      "& .MuiChip-icon": {
        transform: "scale(1.1)",
      },
    },
  };

  const visibilityChipStyle = {
    ...chipBaseStyle,
    background:
      board.visibility === "public"
        ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
        : `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
    color:
      board.visibility === "public"
        ? theme.palette.success.contrastText
        : theme.palette.warning.contrastText,
    "&:hover": {
      ...chipBaseStyle["&:hover"],
    },
  };

  const featureChipStyle = {
    ...chipBaseStyle,
    background: isDarkMode
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.6)",
    color: theme.palette.text.primary,
    "& .MuiChip-icon": {
      color: theme.palette.text.secondary,
    },
    "&:hover": {
      ...chipBaseStyle["&:hover"],
      background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
      color: theme.palette.secondary.contrastText,
      "& .MuiChip-icon": {
        color: theme.palette.secondary.contrastText,
      },
    },
  };

  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          flexWrap: "wrap",
          p: 1.5,
          borderRadius: 12,
          bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.4)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Tooltip
          title={
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Board Title
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {board.title || "Board Title"}
              </Typography>
            </Box>
          }
          arrow
          TransitionComponent={Fade}
        >
          <Chip
            sx={titleChipStyle}
            icon={<DashboardIcon />}
            label={
              <Typography
                variant="body2"
                fontWeight={500}
                noWrap
                sx={{ maxWidth: { xs: 140, sm: 220 } }}
              >
                {board.title || "Board Title"}
              </Typography>
            }
            clickable
          />
        </Tooltip>

        <Tooltip
          title={
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Visibility
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {board.visibility === "public"
                  ? "Anyone can view and join"
                  : "Only invited members can access"}
              </Typography>
            </Box>
          }
          arrow
          TransitionComponent={Fade}
        >
          <Chip
            sx={visibilityChipStyle}
            icon={
              board.visibility === "public" ? <PublicIcon /> : <VpnLockIcon />
            }
            label={
              <Typography variant="body2" fontWeight={500}>
                {board.visibility === "public" ? "Public" : "Private"}
              </Typography>
            }
            clickable
          />
        </Tooltip>

        <Tooltip
          title={
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Google Drive
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Sync and backup board to Google Drive
              </Typography>
            </Box>
          }
          arrow
          TransitionComponent={Fade}
        >
          <Chip
            sx={featureChipStyle}
            icon={<AddToDriveIcon />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Drive
              </Typography>
            }
            onClick={handleAddToGoogleDrive}
            clickable
          />
        </Tooltip>

        <Tooltip
          title={
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Automation
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Set up rules and automated actions
              </Typography>
            </Box>
          }
          arrow
          TransitionComponent={Fade}
        >
          <Chip
            sx={featureChipStyle}
            icon={<BoltIcon />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Automation
              </Typography>
            }
            onClick={handleAutomation}
            clickable
          />
        </Tooltip>

        <Tooltip
          title={
            <Box sx={{ textAlign: "center", p: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Filters
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Filter and search cards by criteria
              </Typography>
            </Box>
          }
          arrow
          TransitionComponent={Fade}
        >
          <Chip
            sx={featureChipStyle}
            icon={<FilterListIcon />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Filter
              </Typography>
            }
            onClick={handleFilters}
            clickable
          />
        </Tooltip>
      </Box>
    </Fade>
  );
}

export default BoardBarChips;
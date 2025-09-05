import React from "react";
import {
  Button,
  Menu,
  MenuItem,
  Box,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Check from "@mui/icons-material/Check";

function Templates() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Button
        id="basic-button-templates"
        aria-controls={open ? "basic-menu-templaces" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{
          color: "white",
          fontWeight: 500,
          textTransform: "none",
          borderRadius: 8,
          padding: { xs: "4px 8px", sm: "6px 16px" },
          bgcolor: "rgba(255, 255, 255, 0.1)",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.2)",
            transform: "translateY(-2px)",
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`,
          },
          transition: "all 0.3s ease",
        }}
        endIcon={<ExpandMoreIcon />}
      >
        Templates
      </Button>
      <Menu
        id="basic-menu-templates"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        PaperProps={{
          sx: {
            minWidth: 240,
            maxWidth: 320,
            maxHeight: 400,
            overflowY: "auto",
            borderRadius: 12,
            bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"}`,
            boxShadow: `0 8px 32px ${isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)"}`,
            "&::-webkit-scrollbar": {
              width: 6,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              borderRadius: 3,
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: theme.palette.primary.main,
              borderRadius: 3,
            },
          },
        }}
      >
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="Single" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="1.15" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="Double" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemIcon>
            <Check sx={{ color: theme.palette.success.main }} />
          </ListItemIcon>
          <ListItemText primary="Custom: 1.2" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="Add space before paragraph" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="Add space after paragraph" primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
        <Divider sx={{ mx: 2, my: 1, opacity: 0.5 }} />
        <MenuItem
          sx={{
            borderRadius: 8,
            mx: 1,
            my: 0.5,
            "&:hover": {
              bgcolor: theme.palette.action.selected,
              transform: "translateY(-1px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemText primary="Custom spacing..." primaryTypographyProps={{ fontWeight: 500 }} />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Templates;
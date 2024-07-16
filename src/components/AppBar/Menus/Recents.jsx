import React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Check from "@mui/icons-material/Check";

function Recents() {
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
        id="basic-button-recents"
        aria-controls={open ? "basic-menu-recents" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        sx={{ fontWeight: "bold", color: "white" }}
        endIcon={<ExpandMoreIcon />}
      >
        Recents
      </Button>
      <Menu
        id="basic-menu-recents"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem>
          <ListItemText inset>Single</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemText inset>1.15</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemText inset>Double</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <Check />
          </ListItemIcon>
          Custom: 1.2
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemText>Add space before paragraph</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemText>Add space after paragraph</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem>
          <ListItemText>Custom spacing...</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Recents;

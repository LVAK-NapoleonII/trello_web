import React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import PersonAdd from "@mui/icons-material/PersonAdd";

function Profiles() {
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
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ padding: 0 }}
          aria-controls={open ? "basic-menu-profiles" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar
            sx={{ width: 30, height: 30 }}
            alt="LVAK"
            src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/373052482_796345659163862_3492210870972009521_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFz8Eu77LHqUNbspzw5DZyxJReZnnv7-JklF5mee_v4mWGYtMpzcFCmoIhCjEg0BlJZqPp1Y2-PNBPvfQABRwv7&_nc_ohc=KEyC4Wvi9qoQ7kNvgF9UMmR&_nc_ht=scontent.fsgn2-3.fna&oh=00_AYCJhnx0d4EespVEFnUPOE_uu0jj_zvQnVZ4-f7okmYAHA&oe=6685A88A"
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu-profiles"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={handleClose}>
          <Avatar
            sx={{ width: 28, height: 28, mr: 2 }}
            alt="LVAK"
            src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/373052482_796345659163862_3492210870972009521_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFz8Eu77LHqUNbspzw5DZyxJReZnnv7-JklF5mee_v4mWGYtMpzcFCmoIhCjEg0BlJZqPp1Y2-PNBPvfQABRwv7&_nc_ohc=KEyC4Wvi9qoQ7kNvgF9UMmR&_nc_ht=scontent.fsgn2-3.fna&oh=00_AYCJhnx0d4EespVEFnUPOE_uu0jj_zvQnVZ4-f7okmYAHA&oe=6685A88A"
          />{" "}
          Profile
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Avatar
            sx={{ width: 28, height: 28, mr: 2 }}
            alt="LVAK"
            src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/373052482_796345659163862_3492210870972009521_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeFz8Eu77LHqUNbspzw5DZyxJReZnnv7-JklF5mee_v4mWGYtMpzcFCmoIhCjEg0BlJZqPp1Y2-PNBPvfQABRwv7&_nc_ohc=KEyC4Wvi9qoQ7kNvgF9UMmR&_nc_ht=scontent.fsgn2-3.fna&oh=00_AYCJhnx0d4EespVEFnUPOE_uu0jj_zvQnVZ4-f7okmYAHA&oe=6685A88A"
          />{" "}
          My account
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Add another account
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Profiles;

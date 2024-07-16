import { Button, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React from "react";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import ContentCut from "@mui/icons-material/ContentCut";
import Cloud from "@mui/icons-material/Cloud";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Tooltip from "@mui/material/Tooltip";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import AddCardIcon from "@mui/icons-material/AddCard";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Groups3Icon from "@mui/icons-material/Groups3";
import AssistantIcon from "@mui/icons-material/Assistant";
import AttachmentIcon from "@mui/icons-material/Attachment";

const COLUMN_HEADER_HEIGHT = "50px";

const COLUMN_FOOTER_HEIGHT = "56px";

function BoardContent() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <Box
      sx={{
        width: "100%",
        height: (theme) => theme.trelloCustom.boardContentHeight,
        display: "flex",
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "#34495e" : "#1976d2",
        p: "10px 0",
      }}
    >
      <Box
        sx={{
          bgcolor: "inherit",
          width: "100%",
          height: "100%",
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          "&::-webkit-scrollbar-track": { m: 2 },
        }}
      >
        {/*box column */}
        <Box
          sx={{
            minWidth: "300px",
            maxWidth: "300px",
            ml: 2,
            borderRadius: "6px",
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "#333643" : "#ebecf0",
            height: "fit-content",
            maxHeight: (theme) =>
              `calc(
            ${theme.trelloCustom.boardContentHeight} - 
            ${theme.spacing(5)})`,
          }}
        >
          {/*header*/}
          <Box
            sx={{
              height: COLUMN_HEADER_HEIGHT,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "Bold", cursor: "pointer", fontSize: "1rem" }}
            >
              Column tittle
            </Typography>
            <Box>
              <Tooltip title="More option">
                <ExpandMoreIcon
                  sx={{ color: "text.primary", cursor: "pointer" }}
                  id="basic-column-dropdown"
                  aria-controls={
                    open ? "basic-menu-column-dropdown" : undefined
                  }
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                />
              </Tooltip>
              <Menu
                id="basic-menu-workspaces"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
              >
                <MenuItem>
                  <ListItemIcon>
                    <AddCardIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Add new card</ListItemText>
                </MenuItem>
                <MenuItem>
                  <ListItemIcon>
                    <ContentCut fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Cut</ListItemText>
                </MenuItem>
                <MenuItem>
                  <ListItemIcon>
                    <ContentCopyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Copy</ListItemText>
                </MenuItem>
                <MenuItem>
                  <ListItemIcon>
                    <ContentPasteIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Paste</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem>
                  <ListItemIcon>
                    <DeleteForeverIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Remove this column</ListItemText>
                </MenuItem>
                <MenuItem>
                  <ListItemIcon>
                    <Cloud fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Archive this Column</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          {/*List card*/}
          <Box
            sx={{
              p: "0 5px",
              m: "0 5px",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              overflowX: "hidden",
              overflowY: "auto",
              maxHeight: (theme) =>
                `calc( ${
                  theme.trelloCustom.boardContentHeight
                } -  ${theme.spacing(
                  5
                )} -  ${COLUMN_HEADER_HEIGHT} - ${COLUMN_FOOTER_HEIGHT})`,
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#ced0da",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#bfc2cf",
              },
            }}
          >
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardMedia
                sx={{ height: 140 }}
                image="https://th.bing.com/th/id/OIP.IgKA0VTzX8YgGULq39huzgHaDb?rs=1&pid=ImgDetMain"
                title="green iguana"
              />
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>~LVAK~</Typography>
              </CardContent>
              <CardActions sx={{ p: "0 4px 8px 4px" }}>
                <Button size="small" startIcon={<Groups3Icon />}>
                  20
                </Button>
                <Button size="small" startIcon={<AssistantIcon />}>
                  15
                </Button>
                <Button size="small" startIcon={<AttachmentIcon />}>
                  10
                </Button>
              </CardActions>
            </Card>
            {/* CARD CONTENT */}
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>BBLove</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>BBLove</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>BBLove</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>BBLove</Typography>
              </CardContent>
            </Card>
            <Card
              sx={{
                cursor: "pointer",
                boxShadow: "0 1px 1px grpa(0,0,0.2)",
                overflow: "unset",
              }}
            >
              <CardContent sx={{ p: "1.5", "&:last-child": { p: 1.5 } }}>
                <Typography>BBLove</Typography>
              </CardContent>
            </Card>
          </Box>
          {/*footer*/}
          <Box
            sx={{
              height: COLUMN_HEADER_HEIGHT,
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Button startIcon={<AddCardIcon />}>Add new card</Button>
            <Tooltip tittle="Drag to move">
              <DragHandleIcon sx={{ cursor: "pointer" }} />
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default BoardContent;

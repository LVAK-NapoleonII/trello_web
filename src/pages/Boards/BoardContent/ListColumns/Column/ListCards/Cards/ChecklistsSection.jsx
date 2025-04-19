import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ChecklistsSection = ({
  checklists,
  checklistTitle,
  setChecklistTitle,
  checklistItem,
  setChecklistItem,
  loading,
  handleAddChecklist,
  handleAddChecklistItem,
  handleToggleChecklistItem,
}) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" color="text.primary" gutterBottom>
      Checklists
    </Typography>
    {checklists?.length > 0 && (
      <>
        {checklists.map((checklist, checklistIndex) => (
          <Box key={checklistIndex} sx={{ mb: 3, pl: 2 }}>
            <Typography
              variant="body1"
              fontWeight="medium"
              color="text.primary"
              gutterBottom
            >
              {checklist.title || "Checklist không có tiêu đề"}
            </Typography>
            <List dense>
              {(checklist.items || []).map((item, itemIndex) => (
                <ListItem
                  key={itemIndex}
                  sx={{ py: 0 }}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      checked={item.completed || false}
                      onChange={() =>
                        handleToggleChecklistItem(checklistIndex, itemIndex)
                      }
                      disabled={loading.checklistToggle}
                      color="success"
                    />
                  }
                >
                  <ListItemText
                    primary={item.text || "Item không có nội dung"}
                    sx={{
                      textDecoration: item.completed ? "line-through" : "none",
                      color: "text.primary",
                    }}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Thêm item checklist..."
                value={checklistItem}
                onChange={(e) => setChecklistItem(e.target.value)}
                variant="outlined"
                disabled={loading.checklistItem}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "background.default",
                    borderRadius: 2,
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "text.secondary",
                    },
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={() => handleAddChecklistItem(checklistIndex)}
                disabled={loading.checklistItem || !checklistItem.trim()}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.dark",
                  },
                }}
              >
                {loading.checklistItem ? (
                  <CircularProgress size={20} />
                ) : (
                  "Thêm"
                )}
              </Button>
            </Box>
          </Box>
        ))}
      </>
    )}
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CheckCircleIcon fontSize="small" color="action" />
      <TextField
        fullWidth
        size="small"
        placeholder="Thêm tiêu đề checklist..."
        value={checklistTitle}
        onChange={(e) => setChecklistTitle(e.target.value)}
        variant="outlined"
        disabled={loading.checklist}
        sx={{
          "& .MuiOutlinedInput-root": {
            bgcolor: "background.default",
            borderRadius: 2,
            "& fieldset": {
              borderColor: "divider",
            },
            "&:hover fieldset": {
              borderColor: "text.secondary",
            },
          },
        }}
      />
      <Button
        variant="contained"
        size="small"
        onClick={handleAddChecklist}
        disabled={loading.checklist || !checklistTitle.trim()}
        sx={{
          bgcolor: "primary.main",
          "&:hover": {
            bgcolor: "primary.dark",
          },
        }}
      >
        {loading.checklist ? <CircularProgress size={20} /> : "Thêm Checklist"}
      </Button>
    </Box>
  </Box>
);

export default ChecklistsSection;

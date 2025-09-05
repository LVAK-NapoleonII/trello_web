import { useColorScheme } from "@mui/material/styles";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";

const selectStyles = {
  color: "white",
  ".MuiOutlinedInput-notchedOutline": { borderColor: "white" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "white" },
  ".MuiSvgIcon-root": { color: "white" },
};

const labelStyles = {
  color: "white",
  "&.Mui-focused": { color: "white" },
};

const menuItemStyles = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

function ModeSelect() {
  const { mode, setMode } = useColorScheme();

  const handleChange = (event) => {
    setMode(event.target.value);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel id="dark-light-mode-label" sx={labelStyles}>
        Mode
      </InputLabel>
      <Select
        labelId="dark-light-mode-label"
        id="dark-light-mode-select"
        value={mode}
        label="Mode"
        onChange={handleChange}
        sx={selectStyles}
      >
        <MenuItem value="light">
          <Box sx={menuItemStyles}>
            <LightModeIcon fontSize="small" color="primary" />
            Light
          </Box>
        </MenuItem>
        <MenuItem value="dark">
          <Box sx={menuItemStyles}>
            <Brightness4Icon fontSize="small" color="primary" />
            Dark
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box sx={menuItemStyles}>
            <SettingsSuggestIcon fontSize="small" color="primary" />
            System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

export default ModeSelect;
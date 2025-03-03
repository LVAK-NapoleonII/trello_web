import { useColorScheme } from "@mui/material/styles";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Box from "@mui/material/Box";
import LightModeIcon from "@mui/icons-material/LightMode";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
function ModeSelect() {
  const { mode, setMode } = useColorScheme();
  const handleChange = (event) => {
    // setAge(event.target.value);
    setMode(event.target.value);
    // localStorage.setItem("mode", event.target.value);
    // localStorage.getItem("mode", event.target.value);
    // console.log(event.target.value);
  };

  return (
    <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
      <InputLabel
        id="label-select-dark-light-mode"
        sx={{
          color: "white",
          "&.Mui-focused": {
            color: "white",
          },
        }}
      >
        Mode
      </InputLabel>
      <Select
        labelId="label-select-dark-light-mode"
        id="select-dark-light-mode"
        value={mode}
        label="Mode"
        onChange={handleChange}
        sx={{
          color: "white",
          ".MuiOutlinedInput-notchedOutline": {
            borderColor: "white",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "white",
          },
          ".MuiSvgIcon-root": {
            color: "white",
          },
        }}
      >
        <MenuItem value="light">
          <Box sx={{ display: "flex", alighItems: "center", gap: "8px" }}>
            <LightModeIcon fontSize="small" sx={{ color: "primary.main" }} />
            Light
          </Box>
        </MenuItem>
        <MenuItem value="dark">
          <Box sx={{ display: "flex", alighItems: "center", gap: "8px" }}>
            <Brightness4Icon fontSize="small" sx={{ color: "primary.main" }} />
            Dark
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box sx={{ display: "flex", alighItems: "center", gap: "8px" }}>
            <SettingsSuggestIcon
              fontSize="small"
              sx={{ color: "primary.main" }}
            />
            System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

export default ModeSelect;

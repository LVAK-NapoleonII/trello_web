import "./App.css";
import { useColorScheme } from "@mui/material/styles";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import LightModeIcon from "@mui/icons-material/LightMode";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

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
      <InputLabel id="label-select-dark-light-mode">Mode</InputLabel>
      <Select
        labelId="label-select-dark-light-mode"
        id="select-dark-light-mode"
        value={mode}
        label="Mode"
        onChange={handleChange}
      >
        <MenuItem value="light">
          <Box>
            <div style={{ display: "flex", alighItems: "center", gap: "8px" }}>
              <LightModeIcon fontSize="small" /> Light
            </div>
          </Box>
        </MenuItem>
        <MenuItem value="dark">
          <Box>
            <div style={{ display: "flex", alighItems: "center", gap: "8px" }}>
              <Brightness4Icon fontSize="small" /> Dark
            </div>
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box>
            <div style={{ display: "flex", alighItems: "center", gap: "8px" }}>
              <SettingsSuggestIcon fontSize="small" /> System
            </div>
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
}

function App() {
  return (
    <Container
      disableGutters
      maxWidth={false}
      sx={{ height: "100vh", backgroundColor: "primary.main" }}
    >
      <Box
        sx={{
          backgroundColor: "primary.light",
          width: "100%",
          height: (theme) => theme.trelloCustom.appBarHeight,
          display: "flex",
          alightItem: "center",
        }}
      >
        <ModeSelect />
      </Box>
      <Box
        sx={{
          backgroundColor: "primary.dark",
          width: "100%",
          height: (theme) => theme.trelloCustom.boarBarHeight,
          display: "flex",
          alightItem: "center",
        }}
      >
        Board bar
      </Box>
      <Box
        sx={{
          backgroundColor: "primary.main",
          width: "100%",
          height: (theme) =>
            `calc(100vh - ${theme.trelloCustom.appBarHeight} - ${theme.trelloCustom.boarBarHeight})`,
          display: "flex",
          alightItem: "center",
        }}
      >
        Board content
      </Box>
    </Container>
  );
}

export default App;

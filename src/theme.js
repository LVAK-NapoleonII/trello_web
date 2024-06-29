import { createTheme } from '@mui/material/styles';
import { teal, deepOrange,cyan,orange } from '@mui/material/colors';
import {experimental_extendTheme as extendTheme} from '@mui/material/styles'


// Create a theme instance.
const theme = extendTheme({
  trelloCustom: {
    appBarHeight: '58px',
    boarBarHeight: '60px',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: teal,
        secondary: deepOrange
      },
    },
    dark: {
      palette: {
        primary: cyan,
        secondary: orange,
      },
    },
  },
});
export default theme;
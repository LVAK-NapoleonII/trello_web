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
   components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Name of the slot
        body: {
          // Some CSS
          '*::-webkit-scrollbar': {
            width: '8px',
            height:'8px',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: '#bdc3c7',
            borderRadius: '10px',
          },
           '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'lightgreen',
          },
        },
      },
    },
    // Name of the component
    MuiButton: {
      styleOverrides: {
        // Name of the slot
        root: {
          // Some CSS
          textTransform: 'none',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
         return {
          color: theme.palette.primary.main,
          fontSize: '0.875rem',
         } 
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
          return {
            color: theme.palette.primary.main,
            fontSize: '0.875rem',
             '.MuiOutlinedInput-notchedOutline':{
                bodercolor: theme.palette.primary.light,
              },
            '&:hover': {
              '.MuiOutlinedInput-notchedOutline':{
                bodercolor: theme.palette.primary.main,
              }
            },
            '& fieldset': {
              borderWidth: '1px !important'
            }
          }
          
        }
      },
    },
  },
});
export default theme;
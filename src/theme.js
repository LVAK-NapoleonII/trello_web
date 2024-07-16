import { createTheme } from '@mui/material/styles';
// import { teal, deepOrange,cyan,orange } from '@mui/material/colors';
import {experimental_extendTheme as extendTheme} from '@mui/material/styles';

const APP_BAR_HEIGHT = "58px";
const BOARD_BAR_HEIGHT = "60px";
const BOARD_CONTENT_HEIGHT =  `calc(100vh - ${APP_BAR_HEIGHT} - ${BOARD_BAR_HEIGHT})`;

// Create a theme instance.
const theme = extendTheme({
  trelloCustom: {
    appBarHeight: APP_BAR_HEIGHT,
    boarBarHeight: BOARD_BAR_HEIGHT,
    boardContentHeight : BOARD_CONTENT_HEIGHT
  },
  colorSchemes: {
    // light: {
    //   palette: {
    //     primary: teal,
    //     secondary: deepOrange
    //   },
    // },
    // dark: {
    //   palette: {
    //     primary: cyan,
    //     secondary: orange,
    //   },
    // },
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
            backgroundColor: '#dcdde1',
            borderRadius: '10px',
          },
           '*::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'white',
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
          borderWidth: '0.5px',
          "&:hover": {borderWidth: '0.5px'}
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
         return {
          // color: theme.palette.primary.main,
          fontSize: '0.875rem',
         } 
        }
      },
    }, MuiInputLabel: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
         return {
          // color: theme.palette.primary.main,
          fontSize: '0.875rem',
         } 
        }
      },
    },
     MuiTypography: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
         return {
          '&.MuiTypography': {fontSize: '0.875rem'},
         } 
        }
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        // Name of the slot
        root: ({theme}) => {
          return {
            // color: theme.palette.primary.main,
            fontSize: '0.875rem',
            //  '.MuiOutlinedInput-notchedOutline':{
            //     bodercolor: theme.palette.primary.light,
            //   },
            // '&:hover': {
            //   '.MuiOutlinedInput-notchedOutline':{
            //     bodercolor: theme.palette.primary.main,
            //   }
            // },
            '& fieldset': {
              borderWidth: '0.5px !important'
            },
            '&:hover fieldset': {
              borderWidth: '1px !important'
            },
            '&:Mui-focused fieldset': {
              borderWidth: '1px !important'
            }
          }
          
        }
      },
    },
  },
});
export default theme;
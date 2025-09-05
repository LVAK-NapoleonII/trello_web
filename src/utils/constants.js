// Configuration constants
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_ROOT || 'http://localhost:5000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  ENDPOINTS: {
    LISTS: '/api/lists',
    CARDS: '/api/cards',
    BOARDS: '/api/boards',
  }
};

export const UI_CONSTANTS = {
  COLUMN_HEADER_HEIGHT: '56px',
  COLUMN_FOOTER_HEIGHT: '56px',
  MIN_COLUMN_WIDTH: '350px',
  MAX_COLUMN_WIDTH: '400px',
  ADD_COLUMN_WIDTH: '280px',
};

export const ANIMATION_DURATIONS = {
  DRAG_DROP: 400,
  FADE_IN: 300,
  HOVER_TRANSITION: 200,
  DIALOG_TRANSITION: 600,
};

export const DRAG_CONSTRAINTS = {
  DISTANCE: 8,
  TOUCH_DELAY: 150,
  TOUCH_TOLERANCE: 8,
};
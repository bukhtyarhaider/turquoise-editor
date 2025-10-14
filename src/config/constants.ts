/**
 * Constants for text editing and formatting
 */

export const TEXT_DEFAULTS = {
  fontSize: 24,
  fontFamily: "Arial",
  fill: "#000000",
  opacity: 1,
  align: "center" as const,
  text: "New Text",
};

export const TEXT_CONSTRAINTS = {
  minFontSize: 8,
  maxFontSize: 200,
  minOpacity: 0,
  maxOpacity: 1,
  minWidth: 20,
  minHeight: 20,
};

export const KEYBOARD_SHORTCUTS = {
  DELETE: ["Delete", "Backspace"],
  DUPLICATE: ["d", "D"],
  COPY: ["c", "C"],
  PASTE: ["v", "V"],
  UNDO: ["z", "Z"],
  REDO: ["y", "Y"],
  SELECT_ALL: ["a", "A"],
};

export const TOUCH_GESTURES = {
  TAP_THRESHOLD: 200, // ms
  DOUBLE_TAP_DELAY: 300, // ms
  LONG_PRESS_DURATION: 500, // ms
  SWIPE_THRESHOLD: 50, // pixels
};

export const STORAGE_KEYS = {
  APP_STATE: "currentState",
  USER_PREFERENCES: "userPreferences",
};

export const FILE_CONSTRAINTS = {
  maxSizeInMB: 10,
  acceptedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  acceptedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
};

export const AUTO_SAVE_DELAY = 15000; // 15 seconds
export const STORAGE_CHECK_INTERVAL = 30000; // 30 seconds
export const STORAGE_WARNING_THRESHOLD = 80; // percentage

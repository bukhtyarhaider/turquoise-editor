export { imageService, ImageService } from "./services/imageService";
export { colorService, ColorService } from "./services/colorService";
export { storageService, StorageService } from "./services/storageService";

export { useImageProcessing } from "./composables/useImageProcessing";
export { useTextManagement } from "./composables/useTextManagement";
export { useStageSize } from "./composables/useStageSize";
export {
  useKeyboardShortcuts,
  useClickOutside,
  useViewportHeight,
  useMediaQuery,
  useIsMobile,
} from "./composables/useUIHelpers";

export { Button } from "./ui/Button";
export type { ButtonVariant, ButtonSize } from "./ui/Button";
export { FloatingActionButton, FABMenu } from "./ui/FloatingActionButton";
export { Modal } from "./ui/Modal";

export { CanvasDropZone } from "./features/canvas/CanvasDropZone";
export { TextLayer } from "./features/canvas/TextLayer";
export { DesktopSidebar } from "./features/editor/DesktopSidebar";
export { MobileTextOverlay } from "./features/editor/MobileTextOverlay";

export {
  downloadDataUrl,
  clamp,
  debounce,
  isMobileDevice,
  isTouchDevice,
  generateId,
  calculateAspectRatio,
  getDimensionsWithinBounds,
  isValidImageFile,
  isValidFileSize,
} from "./utils/helpers";

export {
  TEXT_DEFAULTS,
  TEXT_CONSTRAINTS,
  KEYBOARD_SHORTCUTS,
  TOUCH_GESTURES,
  STORAGE_KEYS,
  FILE_CONSTRAINTS,
  AUTO_SAVE_DELAY,
  STORAGE_CHECK_INTERVAL,
  STORAGE_WARNING_THRESHOLD,
} from "./config/constants";

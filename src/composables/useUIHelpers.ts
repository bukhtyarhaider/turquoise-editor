import { useState, useEffect, useCallback } from "react";

export const useKeyboardShortcuts = (
  handlers: Record<string, (e: KeyboardEvent) => void>,
  enabled: boolean = true
) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const key = e.key.toLowerCase();
      const handler = handlers[key];

      if (handler) {
        handler(e);
      }

      // Handle Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        const comboHandler = handlers[`${e.ctrlKey ? "ctrl" : "cmd"}+${key}`];
        if (comboHandler) {
          e.preventDefault();
          comboHandler(e);
        }
      }
    },
    [handlers, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
};

export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true
) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, handler, enabled]);
};

export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      const visualViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - visualViewportHeight;

      setViewportHeight(visualViewportHeight);
      setKeyboardHeight(diff > 0 ? diff : 0);
    };

    updateHeight();
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return { viewportHeight, keyboardHeight };
};

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    const updateMatch = () => setMatches(media.matches);
    updateMatch();

    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener("change", updateMatch);
      return () => media.removeEventListener("change", updateMatch);
    }
    // Fallback for older browsers
    else if (media.addListener) {
      media.addListener(updateMatch);
      return () => media.removeListener(updateMatch);
    }
  }, [query]);

  return matches;
};

export const useIsMobile = (): boolean => {
  return useMediaQuery("(max-width: 1023px)");
};

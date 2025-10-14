import { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "../utils/helpers";

export const useStageSize = (
  containerRef: React.RefObject<HTMLDivElement | null>
) => {
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const updateStageSize = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const styles = window.getComputedStyle(container);

    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const paddingRight = parseFloat(styles.paddingRight) || 0;
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;

    const containerWidth = Math.max(
      0,
      container.offsetWidth - paddingLeft - paddingRight
    );
    const containerHeight = Math.max(
      0,
      container.offsetHeight - paddingTop - paddingBottom
    );

    const isMobile = window.innerWidth < 1024;
    const aspectRatio = 4 / 3;

    if (isMobile) {
      setStageSize({
        width: containerWidth,
        height: containerHeight,
      });
    } else {
      // Maintain 4:3 aspect ratio on desktop
      const calculatedHeight = containerWidth / aspectRatio;
      const adjustedHeight = Math.min(calculatedHeight, containerHeight);

      setStageSize({
        width: containerWidth,
        height: adjustedHeight,
      });
    }
  }, [containerRef]);

  // Debounced version for frequent resize events
  const debouncedUpdateStageSize = useRef(
    debounce(updateStageSize, 100)
  ).current;

  useEffect(() => {
    // Initial size calculation
    updateStageSize();

    // Listen for window resize
    window.addEventListener("resize", debouncedUpdateStageSize);

    // Setup ResizeObserver for container
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(debouncedUpdateStageSize);
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", debouncedUpdateStageSize);
      resizeObserverRef.current?.disconnect();
    };
  }, [containerRef, updateStageSize, debouncedUpdateStageSize]);

  return stageSize;
};

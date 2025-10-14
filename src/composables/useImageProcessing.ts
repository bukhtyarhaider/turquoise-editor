import { useState, useEffect, useCallback, useRef } from "react";
import { imageService } from "../services/imageService";
import { colorService } from "../services/colorService";
import { storageService } from "../services/storageService";
import { isValidImageFile, isValidFileSize } from "../utils/helpers";

interface ImageDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const useImageProcessing = (stageSize: {
  width: number;
  height: number;
}) => {
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [bgRemovedImg, setBgRemovedImg] = useState<HTMLImageElement | null>(
    null
  );
  const [origDims, setOrigDims] = useState<ImageDimensions>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const [bgDims, setBgDims] = useState<ImageDimensions>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [imgScale, setImgScale] = useState(1);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imageService.cleanup();
      abortControllerRef.current?.abort();
    };
  }, []);

  // Hydrate state from storage
  useEffect(() => {
    const hydrateState = async () => {
      try {
        const state = await storageService.loadState();
        if (!state) {
          setIsHydrated(true);
          return;
        }

        // Load original image
        if (state.originalImage?.blob) {
          const img = await imageService.loadImageFromBlob(
            state.originalImage.blob
          );
          setOriginalImg(img);
          setOrigDims(state.origDims);
        }

        // Load processed image and extract colors
        if (state.processedImage?.blob) {
          const img = await imageService.loadImageFromBlob(
            state.processedImage.blob
          );
          setBgRemovedImg(img);
          setBgDims(state.bgDims);

          // Extract color palette
          const palette = await colorService.extractPalette(img, 9);
          setColorPalette(palette);
        }

        setImgScale(state.imgScale);
      } catch (error) {
        console.error("Failed to hydrate state:", error);
        setError("Failed to load previous session");
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateState();
  }, []);

  // Recalculate dimensions when stage size changes
  useEffect(() => {
    if (!originalImg || !bgRemovedImg) return;

    const origCalc = imageService.calculateScaledDimensions(
      originalImg.naturalWidth,
      originalImg.naturalHeight,
      stageSize.width,
      stageSize.height
    );

    const bgCalc = imageService.calculateScaledDimensions(
      bgRemovedImg.naturalWidth,
      bgRemovedImg.naturalHeight,
      stageSize.width,
      stageSize.height
    );

    setOrigDims(origCalc);
    setBgDims(bgCalc);
    setImgScale(origCalc.scale);
  }, [stageSize, originalImg, bgRemovedImg]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file
      if (!isValidImageFile(file)) {
        setError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      if (!isValidFileSize(file, 10)) {
        setError(
          "File size too large. Please upload an image smaller than 10MB"
        );
        return;
      }

      setIsLoading(true);
      setError(null);

      // Create new abort controller for this operation
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        // Load original image
        const originalImage = await imageService.loadImageFromFile(file);
        setOriginalImg(originalImage);

        // Calculate dimensions for original
        const origCalc = imageService.calculateScaledDimensions(
          originalImage.naturalWidth,
          originalImage.naturalHeight,
          stageSize.width,
          stageSize.height
        );
        setOrigDims(origCalc);

        // Remove background
        const bgRemovedBlob = await imageService.removeBackground(file);
        const bgRemovedImage = await imageService.loadImageFromBlob(
          bgRemovedBlob
        );
        setBgRemovedImg(bgRemovedImage);

        // Calculate dimensions for processed image
        const bgCalc = imageService.calculateScaledDimensions(
          bgRemovedImage.naturalWidth,
          bgRemovedImage.naturalHeight,
          stageSize.width,
          stageSize.height
        );
        setBgDims(bgCalc);
        setImgScale(bgCalc.scale);

        // Extract color palette
        const palette = await colorService.extractPalette(bgRemovedImage, 9);
        setColorPalette(palette);

        // Save to storage
        await storageService.saveState({
          originalImage: { blob: file },
          processedImage: { blob: bgRemovedBlob },
          texts: [],
          origDims: origCalc,
          bgDims: bgCalc,
          imgScale: bgCalc.scale,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return; // Operation was cancelled
        }
        console.error("Image processing error:", error);
        setError("Failed to process image. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [stageSize]
  );

  return {
    originalImg,
    bgRemovedImg,
    origDims,
    bgDims,
    isLoading,
    imgScale,
    isHydrated,
    isOffline,
    colorPalette,
    error,
    handleImageUpload,
  };
};

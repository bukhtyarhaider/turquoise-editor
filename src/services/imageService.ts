import { removeBackground } from "@imgly/background-removal";

/**
 * Service for handling image processing operations
 */
export class ImageService {
  private objectUrls: Set<string> = new Set();

  /**
   * Remove background from an image file
   */
  async removeBackground(file: File): Promise<Blob> {
    try {
      const blob = await removeBackground(file, {
        progress: (_key, current, total) => {
          console.log(
            `Background removal progress: ${Math.round(
              (current / total) * 100
            )}%`
          );
        },
      });
      return blob;
    } catch (error) {
      console.error("Background removal failed:", error);
      throw new Error("Failed to remove background from image");
    }
  }

  /**
   * Load an image from a Blob
   */
  async loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
    const url = this.createObjectUrl(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      img.src = url;
    });
  }

  /**
   * Load an image from a File
   */
  async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    if (!file.type.startsWith("image/")) {
      throw new Error("Invalid file type. Please upload an image.");
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      throw new Error(
        "File size too large. Please upload an image smaller than 10MB."
      );
    }

    const url = this.createObjectUrl(file);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));

      img.src = url;
    });
  }

  /**
   * Create and track an object URL
   */
  private createObjectUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.objectUrls.add(url);
    return url;
  }

  /**
   * Calculate scaled dimensions to fit within a container
   */
  calculateScaledDimensions(
    imageWidth: number,
    imageHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding: number = 20
  ): { width: number; height: number; x: number; y: number; scale: number } {
    const availableWidth = containerWidth - padding * 2;
    const availableHeight = containerHeight - padding * 2;

    const widthScale = availableWidth / imageWidth;
    const heightScale = availableHeight / imageHeight;
    const scale = Math.min(widthScale, heightScale, 1); // Don't upscale

    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;

    return {
      width: scaledWidth,
      height: scaledHeight,
      x,
      y,
      scale,
    };
  }

  /**
   * Cleanup all created object URLs
   */
  cleanup(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls.clear();
  }
}

// Export singleton instance
export const imageService = new ImageService();

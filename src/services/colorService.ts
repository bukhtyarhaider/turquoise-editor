import ColorThief from "colorthief";

export type RGB = [number, number, number];

/**
 * Service for extracting and managing colors from images
 */
export class ColorService {
  private colorThief: ColorThief;

  constructor() {
    this.colorThief = new ColorThief();
  }

  /**
   * Extract color palette from an image
   */
  async extractPalette(
    image: HTMLImageElement,
    colorCount: number = 9
  ): Promise<string[]> {
    try {
      // Ensure image is loaded
      if (!image.complete) {
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Image failed to load"));
        });
      }

      const palette = this.colorThief.getPalette(image, colorCount);
      return palette.map((rgb) => this.rgbToHex(rgb));
    } catch (error) {
      console.error("Failed to extract color palette:", error);
      return [];
    }
  }

  /**
   * Convert RGB array to hex color string
   */
  private rgbToHex([r, g, b]: RGB): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * Convert hex color to RGB array
   */
  hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  }

  /**
   * Calculate relative luminance of a color (for accessibility)
   */
  calculateLuminance(hex: string): number {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map((val) => {
      const normalized = val / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  calculateContrastRatio(color1: string, color2: string): number {
    const lum1 = this.calculateLuminance(color1);
    const lum2 = this.calculateLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color has sufficient contrast for text (WCAG AA standard)
   */
  hasGoodContrast(textColor: string, backgroundColor: string): boolean {
    const ratio = this.calculateContrastRatio(textColor, backgroundColor);
    return ratio >= 4.5; // WCAG AA standard for normal text
  }
}

// Export singleton instance
export const colorService = new ColorService();

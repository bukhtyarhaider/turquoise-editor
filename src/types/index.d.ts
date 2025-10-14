declare module "colorthief" {
  export type RGB = [number, number, number];

  export default class ColorThief {
    getPalette(image: HTMLImageElement, colorCount?: number): RGB[];
  }
}

interface TextProperties {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fill: string;
  opacity: number;
  align?: "left" | "center" | "right";
  gradient?: boolean;
}

interface StoredImage {
  blob: Blob;
}

interface AppState {
  id: string;
  originalImage?: StoredImage;
  processedImage?: StoredImage;
  texts: TextProperties[];
  origDims: { width: number; height: number; x: number; y: number };
  bgDims: { width: number; height: number; x: number; y: number };
  imgScale: number;
}

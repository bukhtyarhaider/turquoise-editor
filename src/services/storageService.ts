import { db } from "../lib/db";

/**
 * Service for managing application storage and state persistence
 */
export class StorageService {
  /**
   * Get current storage usage and quota
   */
  async getStorageInfo(): Promise<{
    usage: number;
    quota: number;
    percentage: number;
  } | null> {
    if (!navigator.storage?.estimate) {
      return null;
    }

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return null;
    }
  }

  /**
   * Check if storage is nearly full (>80%)
   */
  async isStorageNearlyFull(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info ? info.percentage > 80 : false;
  }

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Save application state with validation
   */
  async saveState(state: Omit<AppState, "id">): Promise<void> {
    try {
      // Check storage before saving
      if (await this.isStorageNearlyFull()) {
        console.warn("Storage is nearly full. Consider clearing old data.");
      }

      await db.saveState(state);
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        throw new Error("Storage quota exceeded. Please clear some data.");
      }
      throw error;
    }
  }

  /**
   * Load application state
   */
  async loadState(): Promise<AppState | null> {
    try {
      return await db.loadState();
    } catch (error) {
      console.error("Failed to load state:", error);
      return null;
    }
  }

  /**
   * Clear application state
   */
  async clearState(): Promise<void> {
    try {
      await db.clearState();
    } catch (error) {
      console.error("Failed to clear state:", error);
      throw new Error("Failed to clear workspace data");
    }
  }

  /**
   * Convert Blob to Base64 (for smaller images if needed)
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert Base64 to Blob
   */
  async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }
}

// Export singleton instance
export const storageService = new StorageService();

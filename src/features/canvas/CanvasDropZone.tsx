import React, { useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

interface CanvasDropZoneProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDraggingOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  hasImage: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}

export const CanvasDropZone: React.FC<CanvasDropZoneProps> = ({
  onFileChange,
  isDraggingOver,
  onDragOver,
  onDragLeave,
  onDrop,
  hasImage,
  isLoading,
  children,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!hasImage && !isLoading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`relative bg-white rounded-xl shadow-lg p-4 transition-all duration-300 ${
        isDraggingOver
          ? "border-4 border-dashed border-brand-500"
          : "border border-brand-100"
      } ${
        !hasImage && !isLoading ? "cursor-pointer hover:border-brand-300" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        aria-label="Upload image"
      />

      {children}

      {!hasImage && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-brand-500">
            <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" />
            <p className="text-base font-medium">
              {isDraggingOver ? "Drop image here" : "Tap or drag to upload"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

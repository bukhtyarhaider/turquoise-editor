import React from "react";
import { X, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { FONTS } from "../../constants/fonts";

interface MobileTextOverlayProps {
  selectedText: TextProperties;
  tempText: string | null;
  showColorPicker: boolean;
  colorPalette: string[];
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onDone: () => void;
  onCancel: () => void;
  setShowColorPicker: (show: boolean) => void;
  updateTextProperty: (
    id: string,
    property: keyof TextProperties,
    value: string | number
  ) => void;
  deleteText: (id: string) => void;
}

export const MobileTextOverlay: React.FC<MobileTextOverlayProps> = ({
  selectedText,
  tempText,
  showColorPicker,
  colorPalette,
  onTextChange,
  onDone,
  onCancel,
  setShowColorPicker,
  updateTextProperty,
  deleteText,
}) => {
  return (
    <div className="fixed inset-0 flex flex-col z-50 backdrop-blur-sm bg-black/30">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-transparent">
        <button
          onClick={onCancel}
          className="text-black text-lg font-semibold bg-white rounded-full px-4 py-2"
          aria-label="Cancel text editing"
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          className="text-black text-lg font-semibold bg-white rounded-full px-4 py-2"
          aria-label="Save text"
        >
          Done
        </button>
      </div>

      {/* Text Input Area */}
      <div className="flex-1 flex items-center justify-center px-4">
        <textarea
          value={tempText || ""}
          onChange={onTextChange}
          placeholder="Type your text..."
          className="w-full max-w-md text-3xl font-bold bg-transparent border-none outline-none resize-none text-center leading-tight"
          style={{
            fontFamily: selectedText.fontFamily,
            color: selectedText.fill,
            textAlign: selectedText.align || "center",
            opacity: selectedText.opacity || 1,
          }}
          rows={4}
          autoFocus
          aria-label="Mobile text input"
        />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-t-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          {/* Alignment Controls */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() =>
                updateTextProperty(selectedText.id, "align", "left")
              }
              className={`p-2 rounded-full ${
                selectedText.align === "left"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-200 text-brand-700"
              }`}
              aria-label="Align left"
            >
              <AlignLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                updateTextProperty(selectedText.id, "align", "center")
              }
              className={`p-2 rounded-full ${
                selectedText.align === "center"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-200 text-brand-700"
              }`}
              aria-label="Align center"
            >
              <AlignCenter className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                updateTextProperty(selectedText.id, "align", "right")
              }
              className={`p-2 rounded-full ${
                selectedText.align === "right"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-200 text-brand-700"
              }`}
              aria-label="Align right"
            >
              <AlignRight className="w-6 h-6" />
            </button>
            {/* Delete Button */}
            <button
              onClick={() => deleteText(selectedText.id)}
              className="flex-1 flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg"
            >
              <Trash2 className="w-6 h-6" />
            </button>{" "}
            {/* Opacity Slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedText.opacity || 1}
              onChange={(e) => {
                const newOpacity = parseFloat(e.target.value);
                updateTextProperty(selectedText.id, "opacity", newOpacity);
              }}
              className="w-20 accent-brand-500"
              aria-label="Text opacity"
            />
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-8 h-8 rounded-full border border-brand-200 shadow-sm"
              style={{ backgroundColor: selectedText.fill }}
              aria-label="Open color picker"
            />
            {showColorPicker && (
              <div className="absolute bottom-12 right-0 z-50 bg-white p-4 rounded-lg shadow-xl border border-brand-200">
                <HexColorPicker
                  color={selectedText.fill}
                  onChange={(color) =>
                    updateTextProperty(selectedText.id, "fill", color)
                  }
                  className="w-30"
                />
                {colorPalette.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs text-brand-700 block w-full">
                      Suggested Colors:
                    </span>
                    {colorPalette.map((color, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          updateTextProperty(selectedText.id, "fill", color)
                        }
                        className="w-6 h-6 rounded-full border border-brand-200 hover:border-brand-500"
                        style={{ backgroundColor: color }}
                        aria-label={`Apply color ${color}`}
                      />
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setShowColorPicker(false)}
                  className="mt-3 w-full text-brand-500 hover:text-brand-600 text-sm flex items-center justify-center gap-1"
                  aria-label="Close color picker"
                >
                  <X className="w-4 h-4" /> Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Font Selector */}
        <div className="flex space-x-3 pb-4 overflow-x-auto">
          {FONTS.map((font, index) => (
            <button
              key={`${font}-${index}`}
              onClick={() =>
                updateTextProperty(selectedText.id, "fontFamily", font)
              }
              style={{ fontFamily: font }}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                selectedText.fontFamily === font
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-brand-700 hover:bg-brand-50"
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

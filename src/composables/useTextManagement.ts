import { useState, useEffect, useCallback, useMemo } from "react";
import Konva from "konva";
import { storageService } from "../services/storageService";
import { generateId } from "../utils/helpers";
import { TEXT_DEFAULTS, TEXT_CONSTRAINTS } from "../config/constants";

export const useTextManagement = (stageSize: {
  width: number;
  height: number;
}) => {
  const [texts, setTexts] = useState<TextProperties[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Load initial state
  useEffect(() => {
    const loadTexts = async () => {
      try {
        const state = await storageService.loadState();
        if (state?.texts && state.texts.length > 0) {
          setTexts(state.texts);
          setSelectedTextId(state.texts[state.texts.length - 1].id);
        }
      } catch (error) {
        console.error("Failed to load texts:", error);
      }
    };
    loadTexts();
  }, []);

  // Persist texts to storage
  const persistTexts = useCallback(async (newTexts: TextProperties[]) => {
    try {
      const currentState = await storageService.loadState();
      if (!currentState) return;

      await storageService.saveState({ ...currentState, texts: newTexts });
    } catch (error) {
      console.error("Failed to persist texts:", error);
    }
  }, []);

  // Add new text
  const addText = useCallback(async () => {
    const newText: TextProperties = {
      id: generateId("text"),
      text: TEXT_DEFAULTS.text,
      x: stageSize.width / 2.5,
      y: stageSize.height / 8,
      fontSize: TEXT_DEFAULTS.fontSize,
      fontFamily: TEXT_DEFAULTS.fontFamily,
      fill: TEXT_DEFAULTS.fill,
      opacity: TEXT_DEFAULTS.opacity,
      align: TEXT_DEFAULTS.align,
    };

    setTexts((prev) => {
      const newTexts = [...prev, newText];
      persistTexts(newTexts);
      return newTexts;
    });
    setSelectedTextId(newText.id);
  }, [stageSize, persistTexts]);

  // Delete text
  const deleteText = useCallback(
    async (id: string) => {
      setTexts((prev) => {
        const newTexts = prev.filter((text) => text.id !== id);
        persistTexts(newTexts);
        return newTexts;
      });
      if (selectedTextId === id) {
        setSelectedTextId(null);
      }
    },
    [selectedTextId, persistTexts]
  );

  // Update text property with validation
  const updateTextProperty = useCallback(
    async (
      id: string,
      property: keyof TextProperties,
      value: string | number
    ) => {
      // Validate numeric values
      if (property === "fontSize" && typeof value === "number") {
        value = Math.max(
          TEXT_CONSTRAINTS.minFontSize,
          Math.min(value, TEXT_CONSTRAINTS.maxFontSize)
        );
      }

      if (property === "opacity" && typeof value === "number") {
        value = Math.max(
          TEXT_CONSTRAINTS.minOpacity,
          Math.min(value, TEXT_CONSTRAINTS.maxOpacity)
        );
      }

      setTexts((prev) => {
        const newTexts = prev.map((text) =>
          text.id === id ? { ...text, [property]: value } : text
        );
        persistTexts(newTexts);
        return newTexts;
      });
    },
    [persistTexts]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (e: Konva.KonvaEventObject<DragEvent>, id: string) => {
      const newX = Math.max(0, Math.min(e.target.x(), stageSize.width));
      const newY = Math.max(0, Math.min(e.target.y(), stageSize.height));

      setTexts((prev) => {
        const newTexts = prev.map((text) =>
          text.id === id ? { ...text, x: newX, y: newY } : text
        );
        persistTexts(newTexts);
        return newTexts;
      });
    },
    [stageSize, persistTexts]
  );

  // Handle transform end
  const handleTransformEnd = useCallback(
    async (id: string, node: Konva.Text) => {
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Reset scale and apply to fontSize
      node.scaleX(1);
      node.scaleY(1);

      const newFontSize = Math.max(
        TEXT_CONSTRAINTS.minFontSize,
        Math.min(
          node.fontSize() * Math.min(scaleX, scaleY),
          TEXT_CONSTRAINTS.maxFontSize
        )
      );

      setTexts((prev) => {
        const newTexts = prev.map((text) =>
          text.id === id
            ? {
                ...text,
                x: node.x(),
                y: node.y(),
                fontSize: newFontSize,
              }
            : text
        );
        persistTexts(newTexts);
        return newTexts;
      });
    },
    [persistTexts]
  );

  // Duplicate text
  const duplicateText = useCallback(
    async (id: string) => {
      const textToDuplicate = texts.find((t) => t.id === id);
      if (!textToDuplicate) return;

      const newText: TextProperties = {
        ...textToDuplicate,
        id: generateId("text"),
        x: textToDuplicate.x + 20,
        y: textToDuplicate.y + 20,
      };

      setTexts((prev) => {
        const newTexts = [...prev, newText];
        persistTexts(newTexts);
        return newTexts;
      });
      setSelectedTextId(newText.id);
    },
    [texts, persistTexts]
  );

  // Get selected text
  const selectedText = useMemo(() => {
    return texts.find((text) => text.id === selectedTextId) || null;
  }, [texts, selectedTextId]);

  return {
    texts,
    selectedTextId,
    selectedText,
    setSelectedTextId,
    addText,
    deleteText,
    updateTextProperty,
    handleDragEnd,
    handleTransformEnd,
    duplicateText,
  };
};

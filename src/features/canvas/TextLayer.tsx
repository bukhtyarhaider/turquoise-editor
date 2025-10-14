import React from "react";
import { Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";

interface TextLayerProps {
  texts: TextProperties[];
  selectedTextId: string | null;
  hiddenTextId: string | null;
  isMobile: boolean;
  textRefs: React.MutableRefObject<{ [key: string]: Konva.Text }>;
  trRef: React.RefObject<Konva.Transformer | null>;
  onTextClick: (textId: string) => void;
  onTextTap: (textId: string) => void;
  onTextDblTap: (textId: string) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, textId: string) => void;
  onTransformEnd: (textId: string, node: Konva.Text) => void;
}

export const TextLayer: React.FC<TextLayerProps> = ({
  texts,
  selectedTextId,
  hiddenTextId,
  isMobile,
  textRefs,
  trRef,
  onTextClick,
  onTextTap,
  onTextDblTap,
  onDragEnd,
  onTransformEnd,
}) => {
  return (
    <>
      {texts.map(
        (text) =>
          text.id !== hiddenTextId && (
            <KonvaText
              key={text.id}
              text={text.text}
              x={text.x}
              y={text.y}
              fontSize={text.fontSize}
              fontFamily={text.fontFamily}
              fill={text.fill}
              opacity={text.opacity}
              align={text.align || "center"}
              draggable
              ref={(node) => {
                if (node) textRefs.current[text.id] = node;
              }}
              onClick={(e) => {
                if (!isMobile) {
                  e.cancelBubble = true;
                  onTextClick(text.id);
                }
              }}
              onTap={() => onTextTap(text.id)}
              onDblTap={() => onTextDblTap(text.id)}
              onDragEnd={(e) => onDragEnd(e, text.id)}
              onTransformEnd={() =>
                onTransformEnd(text.id, textRefs.current[text.id])
              }
            />
          )
      )}
      <Transformer
        ref={trRef}
        enabled={!!selectedTextId && !isMobile}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20 || newBox.height < 20) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </>
  );
};

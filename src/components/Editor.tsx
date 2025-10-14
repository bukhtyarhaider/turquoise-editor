import { useRef, useEffect, useState, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import Konva from "konva";
import { debounce } from "lodash-es";
import WebFont from "webfontloader";

import { useStageSize } from "../composables/useStageSize";
import { useImageProcessing } from "../composables/useImageProcessing";
import { useTextManagement } from "../composables/useTextManagement";
import { useIsMobile, useViewportHeight } from "../composables/useUIHelpers";

import { DesktopSidebar } from "../features/editor/DesktopSidebar";
import { MobileTextOverlay } from "../features/editor/MobileTextOverlay";
import { TextLayer } from "../features/canvas/TextLayer";
import { FABMenu } from "../ui/FloatingActionButton";

import TextControls from "./TextControls";
import ExportPopup from "./ExportPopup";
import Header from "./Header";
import Loader from "./Loader";
import AboutModal from "./AboutModal";

import {
  DocumentCheckIcon,
  InformationCircleIcon,
  TrashIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

import { FONTS } from "../constants/fonts";
import { db } from "../lib/db";
import { storageService } from "../services/storageService";
import { AUTO_SAVE_DELAY } from "../config/constants";

const Editor: React.FC = () => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const textRefs = useRef<{ [key: string]: Konva.Text }>({});
  const trRef = useRef<Konva.Transformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // UI State
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    quota: number;
    usage: number;
  } | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [tempText, setTempText] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [hiddenTextId, setHiddenTextId] = useState<string | null>(null);

  // Custom Hooks
  const isMobile = useIsMobile();
  const { keyboardHeight } = useViewportHeight();
  const stageSize = useStageSize(containerRef);

  const {
    originalImg,
    bgRemovedImg,
    origDims,
    bgDims,
    isLoading,
    imgScale,
    handleImageUpload,
    isOffline,
    isHydrated,
    colorPalette,
  } = useImageProcessing(stageSize);

  const {
    texts,
    selectedTextId,
    selectedText,
    setSelectedTextId,
    addText,
    deleteText,
    updateTextProperty,
    handleDragEnd,
    handleTransformEnd,
  } = useTextManagement(stageSize);

  useEffect(() => {
    WebFont.load({
      google: { families: FONTS },
    });
  }, []);

  // Sync tempText and scroll text into view (mobile)
  useEffect(() => {
    if (
      !isMobile ||
      !texts.length ||
      !selectedTextId ||
      !textRefs.current[selectedTextId] ||
      !showTextOverlay
    )
      return;

    const selected = texts.find((t) => t.id === selectedTextId);
    if (selected) {
      setTempText(selected.text);
      const node = textRefs.current[selectedTextId];
      const stage = stageRef.current;
      if (node && stage) {
        const textY = node.y();
        const stageHeight = stage.height();
        const scrollOffset = textY - stageHeight / 2 + node.height() / 2;
        containerRef.current?.scrollTo({
          top: scrollOffset,
          behavior: "smooth",
        });
      }
    }
  }, [selectedTextId, isMobile, texts, showTextOverlay]);

  // Auto-save
  useEffect(() => {
    const autoSave = debounce(async () => {
      if (!isHydrated || !bgRemovedImg) return;

      try {
        const originalBlob = originalImg?.src
          ? await fetch(originalImg.src).then((r) => r.blob())
          : undefined;

        const processedBlob = bgRemovedImg?.src
          ? await fetch(bgRemovedImg.src).then((r) => r.blob())
          : undefined;

        await db.saveState({
          originalImage: originalBlob ? { blob: originalBlob } : undefined,
          processedImage: processedBlob ? { blob: processedBlob } : undefined,
          texts,
          origDims,
          bgDims,
          imgScale,
        });
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, AUTO_SAVE_DELAY);

    autoSave();
    return () => autoSave.cancel();
  }, [
    texts,
    origDims,
    bgDims,
    imgScale,
    isHydrated,
    bgRemovedImg,
    originalImg,
  ]);

  // Storage monitoring
  useEffect(() => {
    const checkStorage = async () => {
      const info = await storageService.getStorageInfo();
      if (info) {
        setStorageStatus({ usage: info.usage, quota: info.quota });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (trRef.current) {
      if (selectedTextId && textRefs.current[selectedTextId]) {
        trRef.current.nodes([textRefs.current[selectedTextId]]);
      } else {
        trRef.current.nodes([]);
      }
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedTextId, stageSize, texts]);

  // Update controls position when text is selected (desktop)
  useEffect(() => {
    if (
      selectedTextId &&
      textRefs.current[selectedTextId] &&
      stageRef.current &&
      !isMobile
    ) {
      const node = textRefs.current[selectedTextId];
      const stage = stageRef.current;
      const stageRect = stage.container().getBoundingClientRect();

      const textRect = node.getClientRect();
      const newX = Math.min(
        textRect.x - stageRect.left + textRect.width + 10 / 2,
        stageSize.width - 320
      );
      const newY = Math.max(textRect.y + 30, 10);

      setControlsPosition({
        x: stageRect.left + newX,
        y: stageRect.top + newY,
      });
    }
  }, [selectedTextId, texts, stageSize, isMobile]);

  // Arrow key navigation for text selection (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTextId || texts.length <= 1 || isMobile) return;

      const currentIndex = texts.findIndex((t) => t.id === selectedTextId);
      let newIndex: number;

      if (e.key === "ArrowUp") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : texts.length - 1;
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        newIndex = currentIndex < texts.length - 1 ? currentIndex + 1 : 0;
        e.preventDefault();
      } else {
        return;
      }

      setSelectedTextId(texts[newIndex].id);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTextId, texts, setSelectedTextId, isMobile]);

  // Handle canvas click to deselect text
  const handleCanvasClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isMobile) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const target = e.target;
      const isText = target instanceof Konva.Text;
      const transformer = trRef.current;
      const isTransformerChild =
        transformer && transformer.getChildren().includes(target);
      const isLayer = target instanceof Konva.Layer;
      const isStage = target === stage;

      if ((isStage || isLayer) && !isText && !isTransformerChild) {
        setSelectedTextId(null);
      }
    },
    [isMobile, setSelectedTextId]
  );

  // Handle export/save
  const handleSave = useCallback(() => {
    if (!stageRef.current) return;

    trRef.current?.visible(false);
    trRef.current?.getLayer()?.batchDraw();

    const pixelRatio = imgScale > 0 ? 1 / imgScale : 1;
    const uri = stageRef.current.toDataURL({
      x: origDims.x,
      y: origDims.y,
      width: origDims.width,
      height: origDims.height,
      pixelRatio,
    });

    trRef.current?.visible(true);
    trRef.current?.getLayer()?.batchDraw();

    const link = document.createElement("a");
    link.download = "design.png";
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportPopup(true);
    setTimeout(() => setShowExportPopup(false), 5000);
  }, [imgScale, origDims]);

  // Handle file drop
  const handleFileDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = e.dataTransfer.files;
      if (files?.length) {
        await handleImageUpload({
          target: { files },
        } as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [handleImageUpload]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedTextId(null);
      await handleImageUpload(e);
    },
    [handleImageUpload, setSelectedTextId]
  );

  // Handle text tap (mobile)
  const handleTextTap = useCallback(
    (textId: string) => {
      if (isMobile) {
        setSelectedTextId(textId);
        setShowTextOverlay(false);
      }
    },
    [isMobile, setSelectedTextId]
  );

  // Handle text double tap (mobile - edit)
  const handleTextDblTap = useCallback(
    (textId: string) => {
      if (isMobile) {
        const text = texts.find((t) => t.id === textId);
        if (text) {
          setTempText(text.text);
          setSelectedTextId(textId);
          setShowTextOverlay(true);
          setHiddenTextId(textId);
          trRef.current?.visible(false);
          trRef.current?.getLayer()?.batchDraw();
        }
      }
    },
    [isMobile, texts, setSelectedTextId]
  );

  // Handle mobile input change
  const handleMobileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setTempText(newValue);
      if (selectedTextId) {
        updateTextProperty(selectedTextId, "text", newValue);
      }
    },
    [selectedTextId, updateTextProperty]
  );

  // Handle mobile input done
  const handleMobileInputDone = useCallback(() => {
    trRef.current?.visible(true);
    trRef.current?.getLayer()?.batchDraw();
    setSelectedTextId(null);
    setShowTextOverlay(false);
    setShowColorPicker(false);
    setTempText(null);
    setHiddenTextId(null);
  }, [setSelectedTextId]);

  // Handle workspace reset
  const handleReset = useCallback(async () => {
    if (
      confirm(
        "Are you sure you want to reset the workspace? This will clear all data."
      )
    ) {
      await db.clearState();
      window.location.reload();
    }
  }, []);

  // Computed values
  const hasContent = !!bgRemovedImg && texts.length > 0;

  // FAB Menu actions (mobile)
  const fabActions = [
    {
      icon: <span className="font-bold text-lg">T</span>,
      label: "Add text",
      onClick: addText,
      disabled: !bgRemovedImg,
    },
    {
      icon: <DocumentCheckIcon className="w-5 h-5" />,
      label: "Export image",
      onClick: handleSave,
      disabled: !hasContent,
    },
    {
      icon: <InformationCircleIcon className="w-5 h-5" />,
      label: "About",
      onClick: () => setShowAboutModal(true),
    },
    {
      icon: <TrashIcon className="w-5 h-5" />,
      label: "Reset workspace",
      onClick: handleReset,
      variant: "danger" as const,
    },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-brand-50 to-brand-100 overflow-hidden">
      {/* Loading Overlay */}
      <Loader
        loading={!isHydrated}
        text="Loading your workspace..."
        variant="workspace"
      />

      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center p-2 z-30">
          Offline mode - some features may be limited
        </div>
      )}

      {/* Modals & Popups */}
      <ExportPopup
        isOpen={showExportPopup}
        isMobile={isMobile}
        onClose={() => setShowExportPopup(false)}
      />
      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        isMobile={isMobile}
      />

      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas Container */}
        <div
          className={`flex-1 bg-white m-2 lg:m-4 rounded-xl shadow-lg p-4 relative overflow-y-auto transition-all duration-300 ${
            isDraggingOver
              ? "border-4 border-dashed border-brand-500"
              : "border border-brand-100"
          }`}
          ref={containerRef}
          style={{
            maxHeight: `calc(100vh - ${
              keyboardHeight + (isMobile ? 120 : 100)
            }px)`,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleFileDrop}
        >
          {/* Konva Stage */}
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            ref={stageRef}
            className={`w-full h-full rounded-lg bg-neutral-50 shadow-inner ${
              !originalImg && !isLoading
                ? "cursor-pointer hover:bg-neutral-100"
                : ""
            }`}
            onClick={(e) => {
              if (!originalImg && !isLoading && e.target === e.currentTarget) {
                fileInputRef.current?.click();
              }
              handleCanvasClick(e);
            }}
          >
            {/* Original Image Layer */}
            <Layer>
              {originalImg && (
                <KonvaImage
                  image={originalImg}
                  x={origDims.x}
                  y={origDims.y}
                  width={origDims.width}
                  height={origDims.height}
                  listening={false}
                />
              )}
            </Layer>

            {/* Text Layer */}
            <Layer>
              <TextLayer
                texts={texts}
                selectedTextId={selectedTextId}
                hiddenTextId={hiddenTextId}
                isMobile={isMobile}
                textRefs={textRefs}
                trRef={trRef}
                onTextClick={setSelectedTextId}
                onTextTap={handleTextTap}
                onTextDblTap={handleTextDblTap}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            </Layer>

            {/* Background Removed Image Layer */}
            <Layer>
              {bgRemovedImg && (
                <KonvaImage
                  image={bgRemovedImg}
                  x={bgDims.x}
                  y={bgDims.y}
                  width={bgDims.width}
                  height={bgDims.height}
                  listening={false}
                />
              )}
            </Layer>
          </Stage>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Upload Prompt */}
          {!originalImg && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-brand-500">
                <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-2" />
                <p className="text-base font-medium">
                  {isDraggingOver ? "Drop image here" : "Tap or drag to upload"}
                </p>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          <Loader
            loading={isLoading}
            text="Processing image..."
            variant="image"
          />

          {/* Desktop Text Controls */}
          {!isMobile && selectedText && (
            <TextControls
              selectedText={selectedText}
              updateTextProperty={updateTextProperty}
              position={controlsPosition}
              colorPalette={colorPalette}
            />
          )}
        </div>

        {/* Desktop Sidebar */}
        <DesktopSidebar
          texts={texts}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
          deleteText={deleteText}
          addText={addText}
          handleSave={handleSave}
          hasImage={!!bgRemovedImg}
          hasContent={hasContent}
          storageInfo={storageStatus}
        />

        {/* Mobile FAB Menu */}
        {isMobile && (
          <FABMenu
            isOpen={showFabMenu}
            onToggle={() => setShowFabMenu((prev) => !prev)}
            actions={fabActions}
          />
        )}

        {/* Mobile Text Overlay */}
        {isMobile && selectedText && showTextOverlay && (
          <MobileTextOverlay
            selectedText={selectedText}
            tempText={tempText}
            showColorPicker={showColorPicker}
            colorPalette={colorPalette}
            onTextChange={handleMobileInputChange}
            onDone={handleMobileInputDone}
            onCancel={handleMobileInputDone}
            setShowColorPicker={setShowColorPicker}
            updateTextProperty={updateTextProperty}
            deleteText={deleteText}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;

import { useRef, useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Transformer,
} from "react-konva";
import Konva from "konva";
import { debounce } from "lodash-es";
import TextControls from "./TextControls";
import TextList from "./TextList";
import { useStageSize } from "../hooks/useStageSize";
import { useImageProcessing } from "../hooks/useImageProcessing";
import { useTextManagement } from "../hooks/useTextManagement";
import {
  ArrowUpTrayIcon,
  DocumentCheckIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  InformationCircleIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
} from "@heroicons/react/24/outline";
import { HexColorPicker } from "react-colorful";
import WebFont from "webfontloader";
import { FONTS } from "../constants/fonts";
import { db } from "../lib/db";
import ExportPopup from "./ExportPopup";
import Header from "./Header";
import Loader from "./Loader";
import AboutModal from "./AboutModal";

const Editor: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const textRefs = useRef<{ [key: string]: Konva.Text }>({});
  const trRef = useRef<Konva.Transformer | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [storageStatus, setStorageStatus] = useState<{
    quota: number;
    usage: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [tempText, setTempText] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [controlsPosition, setControlsPosition] = useState({ x: 0, y: 0 });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [hiddenTextId, setHiddenTextId] = useState<string | null>(null);

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
    setSelectedTextId,
    addText,
    deleteText,
    updateTextProperty,
    handleDragEnd,
    handleTransformEnd,
  } = useTextManagement(stageSize);

  // Load all fonts on mount to ensure availability on mobile
  useEffect(() => {
    WebFont.load({
      google: { families: FONTS },
    });
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Detect keyboard height
  useEffect(() => {
    const updateKeyboardHeight = () => {
      const visualViewportHeight =
        window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - visualViewportHeight;
      setKeyboardHeight(diff > 0 ? diff : 0);
    };

    window.visualViewport?.addEventListener("resize", updateKeyboardHeight);
    return () =>
      window.visualViewport?.removeEventListener(
        "resize",
        updateKeyboardHeight
      );
  }, []);

  // Sync tempText and scroll text into view
  useEffect(() => {
    if (
      !isMobile ||
      !texts.length ||
      !selectedTextId ||
      !textRefs.current[selectedTextId] ||
      !showTextOverlay
    )
      return;

    const selectedText = texts.find((t) => t.id === selectedTextId);
    if (selectedText) {
      setTempText(selectedText.text);
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
  }, [selectedTextId, isMobile, texts, stageSize, showTextOverlay]);

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
    }, 15000);

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
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageStatus({
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        });
      }
    };

    checkStorage();
    const interval = setInterval(checkStorage, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Update controls position when text is selected
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

  // Handle arrow key navigation for text selection
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

    setTimeout(() => {
      setShowExportPopup(false);
    }, 5000);
  }, [imgScale, origDims]);

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

  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedTextId(null);
      await handleImageUpload(e);
    },
    [handleImageUpload, setSelectedTextId]
  );

  const handleTextTap = useCallback(
    (textId: string) => {
      if (isMobile) {
        setSelectedTextId(textId);
        setShowTextOverlay(false);
      }
    },
    [isMobile, setSelectedTextId]
  );

  const handleTextDblTap = useCallback(
    (textId: string) => {
      if (isMobile) {
        const selectedText = texts.find((t) => t.id === textId);
        if (selectedText) {
          setTempText(selectedText.text);
          setSelectedTextId(textId);
          setShowTextOverlay(true);
          setHiddenTextId(textId);
          trRef.current?.visible(false);
          trRef.current?.getLayer()?.batchDraw();
        }
      }
    },
    [isMobile, texts, setTempText, setSelectedTextId]
  );

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

  const handleMobileInputDone = () => {
    trRef.current?.visible(true);
    trRef.current?.getLayer()?.batchDraw();
    setSelectedTextId(null);
    setShowTextOverlay(false);
    setTempText(null);
    setHiddenTextId(null);
  };

  const hasContent = !!bgRemovedImg && texts.length > 0;
  const selectedText = texts.find((text) => text.id === selectedTextId) || null;

  const desktopSidebar = (
    <div className="hidden lg:block w-96 bg-white m-4 rounded-xl shadow-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-brand-700">Editor Controls</h2>
        {storageStatus && (
          <div className="text-xs text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded-full">
            Storage: {(storageStatus.usage / 1024 / 1024).toFixed(1)}MB used
          </div>
        )}
      </div>
      <button
        disabled={!bgRemovedImg}
        onClick={addText}
        className={`w-full py-3 flex items-center justify-center gap-2 text-white font-semibold rounded-lg transition-all ${
          bgRemovedImg
            ? "bg-brand-500 hover:bg-brand-600"
            : "bg-gray-300 cursor-not-allowed"
        }`}
      >
        <PlusIcon className="w-5 h-5" /> Add Text
      </button>
      <div className="flex-1 overflow-y-auto space-y-6 mt-4">
        <TextList
          texts={texts}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
          deleteText={deleteText}
        />
      </div>
      <div className="space-y-4 mt-4">
        <button
          onClick={handleSave}
          disabled={!hasContent}
          className={`w-full py-3 flex items-center justify-center gap-2 text-white font-semibold rounded-lg transition-all ${
            hasContent
              ? "bg-brand-700 hover:bg-brand-800"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <DocumentCheckIcon className="w-5 h-5" /> Export Image
        </button>
        <button
          onClick={async () => {
            await db.clearState();
            window.location.reload();
          }}
          className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:text-red-700 text-sm"
        >
          <TrashIcon className="w-4 h-4" /> Reset Workspace
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-brand-50 to-brand-100 overflow-hidden">
      <Loader
        loading={!isHydrated}
        text="Loading your workspace..."
        variant="workspace"
      />

      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center p-2 z-30">
          Offline mode - some features may be limited
        </div>
      )}

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

      <Header />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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
            <Layer>
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
                          setSelectedTextId(text.id);
                        }
                      }}
                      onTap={() => handleTextTap(text.id)}
                      onDblTap={() => handleTextDblTap(text.id)}
                      onDragEnd={(e) => handleDragEnd(e, text.id)}
                      onTransformEnd={() =>
                        handleTransformEnd(text.id, textRefs.current[text.id])
                      }
                    />
                  )
              )}
              <Transformer
                ref={trRef}
                enabled={!!selectedTextId}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
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

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

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

          <Loader
            loading={isLoading}
            text="Processing image..."
            variant="image"
          />

          {!isMobile && selectedText && (
            <TextControls
              selectedText={selectedText}
              updateTextProperty={updateTextProperty}
              position={controlsPosition}
              colorPalette={colorPalette}
            />
          )}
        </div>

        {desktopSidebar}

        {isMobile && (
          <>
            <div className="fixed bottom-20 right-4 flex flex-col items-end z-50">
              <button
                onClick={() => setShowFabMenu((prev) => !prev)}
                className="p-3 bg-brand-500 text-white rounded-full shadow-lg transition-all duration-600 hover:scale-105 focus:ring-2 focus:ring-brand-300"
                aria-label="Toggle action menu"
              >
                {showFabMenu ? (
                  <XMarkIcon className="w-8 h-8" />
                ) : (
                  <PlusIcon className="w-8 h-8" />
                )}
              </button>
              {showFabMenu && (
                <div className="mt-2 flex flex-col gap-2 bg-white p-3 rounded-xl shadow-xl animate-[fadeIn_0.2s_ease-out]">
                  <button
                    onClick={() => {
                      addText();
                      setShowFabMenu(false);
                    }}
                    disabled={!bgRemovedImg}
                    className={`p-2 rounded-full w-10 h-10 flex items-center justify-center ${
                      bgRemovedImg
                        ? "bg-brand-500 text-white hover:bg-brand-600"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-label="Add text"
                  >
                    <span className="font-bold text-lg">T</span>
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      setShowFabMenu(false);
                    }}
                    disabled={!hasContent}
                    className={`p-2 rounded-full w-10 h-10 flex items-center justify-center ${
                      hasContent
                        ? "bg-brand-700 text-white hover:bg-brand-800"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                    aria-label="Export image"
                  >
                    <DocumentCheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowAboutModal(true);
                      setShowFabMenu(false);
                    }}
                    className="p-2 rounded-full w-10 h-10 bg-brand-500 text-white hover:bg-brand-700 flex items-center justify-center"
                    aria-label="About"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={async () => {
                      await db.clearState();
                      window.location.reload();
                    }}
                    className="p-2 rounded-full w-10 h-10 bg-red-500 text-white hover:bg-red-600 flex items-center justify-center"
                    aria-label="Reset workspace"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {selectedText && showTextOverlay && (
              <>
                {/* Overlay for Text Input */}
                <div
                  className="fixed inset-0 flex flex-col animate-[slideIn_0.3s_ease-out] z-50"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
                >
                  <div className="flex justify-between items-center p-4 bg-transparent">
                    <button
                      onClick={() => handleMobileInputDone()}
                      className="text-black text-lg font-semibold bg-white rounded-full px-4 py-2"
                      aria-label="Cancel text editing"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleMobileInputDone}
                      className="text-black text-lg font-semibold bg-white rounded-full px-4 py-2"
                      aria-label="Save text"
                    >
                      Done
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center px-4">
                    <textarea
                      value={tempText || ""}
                      onChange={handleMobileInputChange}
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
                  <div className="bg-white p-4 rounded-t-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
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
                          <Bars3BottomLeftIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() =>
                            updateTextProperty(
                              selectedText.id,
                              "align",
                              "center"
                            )
                          }
                          className={`p-2 rounded-full ${
                            selectedText.align === "center"
                              ? "bg-brand-500 text-white"
                              : "bg-gray-200 text-brand-700"
                          }`}
                          aria-label="Align center"
                        >
                          <Bars3Icon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() =>
                            updateTextProperty(
                              selectedText.id,
                              "align",
                              "right"
                            )
                          }
                          className={`p-2 rounded-full ${
                            selectedText.align === "right"
                              ? "bg-brand-500 text-white"
                              : "bg-gray-200 text-brand-700"
                          }`}
                          aria-label="Align right"
                        >
                          <Bars3BottomRightIcon className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => {
                            deleteText(selectedText.id);
                            setSelectedTextId(null);
                            setShowTextOverlay(false);
                            setHiddenTextId(null);
                          }}
                          className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                          aria-label="Delete text"
                        >
                          <TrashIcon className="w-6 h-6" />
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={selectedText.opacity || 1}
                          onChange={(e) => {
                            const newOpacity = parseFloat(e.target.value);
                            updateTextProperty(
                              selectedText.id,
                              "opacity",
                              newOpacity
                            );
                          }}
                          className="w-20 accent-brand-500"
                          aria-label="Text opacity"
                        />
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => setShowColorPicker((prev) => !prev)}
                          className="w-8 h-8 rounded-full border border-brand-200 shadow-sm"
                          style={{ backgroundColor: selectedText.fill }}
                          aria-label="Open color picker"
                        />
                        {showColorPicker && (
                          <div className="absolute bottom-12 right-0 z-50 bg-white p-4 rounded-lg shadow-xl border border-brand-200">
                            <HexColorPicker
                              color={selectedText.fill}
                              onChange={(color) =>
                                updateTextProperty(
                                  selectedText.id,
                                  "fill",
                                  color
                                )
                              }
                              className="w-30"
                            />
                            {colorPalette.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="text-xs text-brand-700 block[0]. block w-full">
                                  Suggested Colors:
                                </span>
                                {colorPalette.map((color, index) => (
                                  <button
                                    key={index}
                                    onClick={() =>
                                      updateTextProperty(
                                        selectedText.id,
                                        "fill",
                                        color
                                      )
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
                              <XMarkIcon className="w-4 h-4" /> Close
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-3 pb-2 overflow-x-auto">
                      {FONTS.map((font, index) => (
                        <button
                          key={`${font}-${index}`}
                          onClick={() =>
                            updateTextProperty(
                              selectedText.id,
                              "fontFamily",
                              font
                            )
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Editor;

import React from "react";
import { Button } from "../../ui/Button";
import { Plus, FileCheck, Trash2 } from "lucide-react";
import { db } from "../../lib/db";
import TextList from "../../components/TextList";
import { storageService } from "../../services/storageService";

interface DesktopSidebarProps {
  texts: TextProperties[];
  selectedTextId: string | null;
  setSelectedTextId: (id: string | null) => void;
  deleteText: (id: string) => void;
  addText: () => void;
  handleSave: () => void;
  hasImage: boolean;
  hasContent: boolean;
  storageInfo: { usage: number; quota: number } | null;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  texts,
  selectedTextId,
  setSelectedTextId,
  deleteText,
  addText,
  handleSave,
  hasImage,
  hasContent,
  storageInfo,
}) => {
  const handleReset = async () => {
    if (
      confirm(
        "Are you sure you want to reset the workspace? This will clear all data."
      )
    ) {
      await db.clearState();
      window.location.reload();
    }
  };

  return (
    <div className="hidden lg:flex w-96 bg-white m-4 rounded-xl shadow-lg p-6 flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-brand-700">Editor Controls</h2>
        {storageInfo && (
          <div className="text-xs text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded-full">
            {storageService.formatBytes(storageInfo.usage)}
          </div>
        )}
      </div>

      <Button
        onClick={addText}
        disabled={!hasImage}
        icon={<Plus className="w-5 h-5" />}
        variant="primary"
        fullWidth
      >
        Add Text
      </Button>

      <div className="flex-1 overflow-y-auto space-y-6 mt-4">
        <TextList
          texts={texts}
          selectedTextId={selectedTextId}
          setSelectedTextId={setSelectedTextId}
          deleteText={deleteText}
        />
      </div>

      <div className="space-y-4 mt-4">
        <Button
          onClick={handleSave}
          disabled={!hasContent}
          icon={<FileCheck className="w-5 h-5" />}
          variant="primary"
          fullWidth
        >
          Export Image
        </Button>

        <Button
          onClick={handleReset}
          icon={<Trash2 className="w-4 h-4" />}
          variant="ghost"
          size="sm"
          fullWidth
        >
          Reset Workspace
        </Button>
      </div>
    </div>
  );
};

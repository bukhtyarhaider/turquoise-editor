import React from "react";
import { FileCheck } from "lucide-react";

interface ExportPopupProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

const ExportPopup: React.FC<ExportPopupProps> = ({
  isOpen,
  isMobile,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-500 bg-opacity-20 flex items-center justify-center z-100">
      <div className="bg-white rounded-xl p-6 w-80 text-center shadow-lg animate-[fadeIn_0.3s_ease-out]">
        <FileCheck className="w-12 h-12 mx-auto text-brand-500 mb-4" />
        <h3 className="text-xl font-bold text-brand-700 mb-2">
          Image Exported!
        </h3>
        <p className="text-brand-600 mb-2">
          Thank you for using Turquoise! Your design has been saved.
        </p>
        {isMobile && (
          <p className="text-sm text-brand-500 mb-4">
            Check the browser alert to download your image.
          </p>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ExportPopup;

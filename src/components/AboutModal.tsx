import packageJson from "../../package.json";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  isMobile,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-brand-700 bg-opacity-40 flex items-center justify-center z-50 ${
        isMobile ? "p-4" : "p-8"
      }`}
    >
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-500 hover:text-brand-600"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-brand-700 mb-4">About</h2>
        <div className="text-brand-600 space-y-2">
          <p>
            <strong>App Name:</strong> {`${packageJson.name}`}
          </p>
          <p>
            <strong>Version:</strong> {`${packageJson.version}`}
          </p>
          <p>
            <strong>Developer:</strong>
            {" Bukhtyar Haider"}
          </p>
          <p>
            <strong>Contact:</strong>
            <a
              href="mailto:developedbybukhtyar@gmail.com"
              className="text-brand-500 hover:underline"
            >
              {` ${"developedbybukhtyar@gmail.com"}`}
            </a>
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {` ${"A simple yet powerful tool for editing images with customizable text overlays."}`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AboutModal;

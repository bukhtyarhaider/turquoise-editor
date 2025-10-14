import { Trash2 } from "lucide-react";
import { useRef } from "react";

interface TextListProps {
  texts: TextProperties[];
  selectedTextId: string | null;
  setSelectedTextId: (id: string) => void;
  deleteText: (id: string) => void;
}

const TextList: React.FC<TextListProps> = ({
  texts,
  selectedTextId,
  setSelectedTextId,
  deleteText,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Text Elements</h3>
        <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-700">
          {texts.length}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-80 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 pr-1"
      >
        {texts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-500">No text elements added yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Click to add your first text
            </p>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {texts.map((text) => (
              <li
                key={text.id}
                className={`group flex items-center justify-between rounded-lg p-2 transition-all duration-150 ${
                  selectedTextId === text.id
                    ? "bg-brand-100/50 ring-1 ring-brand-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    className="h-5 w-5 flex-shrink-0 rounded-full border border-gray-200 transition-colors hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:ring-offset-1"
                    style={{ backgroundColor: text.fill }}
                    aria-label={`Color preview: ${text.fill}`}
                    title={text.fill}
                    onClick={() => setSelectedTextId(text.id)}
                  />
                  <div
                    className="max-w-[180px] cursor-pointer truncate text-sm text-gray-800"
                    onClick={() => setSelectedTextId(text.id)}
                    style={{
                      fontFamily: text.fontFamily,
                      fontSize: `${Math.min(text.fontSize, 14)}px`,
                      opacity: text.opacity,
                    }}
                    title={text.text}
                  >
                    {text.text}
                  </div>
                </div>
                <button
                  onClick={() => deleteText(text.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
                  aria-label={`Delete text: ${text.text}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TextList;

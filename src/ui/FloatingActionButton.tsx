import React from "react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantStyles = {
  primary: "bg-brand-500 hover:bg-brand-600 text-white",
  secondary: "bg-white hover:bg-gray-50 text-brand-700 shadow-lg",
  danger: "bg-red-500 hover:bg-red-600 text-white",
};

const sizeStyles = {
  sm: "w-10 h-10",
  md: "w-12 h-12",
  lg: "w-14 h-14",
};

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  variant = "primary",
  size = "md",
}) => {
  return (
    <button
      onClick={onClick}
      className={`${sizeStyles[size]} ${variantStyles[variant]} rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-brand-300 flex items-center justify-center`}
      aria-label={label}
    >
      {icon}
    </button>
  );
};

interface FABMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  actions: Array<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "danger";
  }>;
}

export const FABMenu: React.FC<FABMenuProps> = ({
  isOpen,
  onToggle,
  actions,
}) => {
  return (
    <div className="fixed bottom-20 right-4 flex flex-col items-end z-50">
      <FloatingActionButton
        onClick={onToggle}
        icon={
          isOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )
        }
        label={isOpen ? "Close menu" : "Open menu"}
      />
      {isOpen && (
        <div className="mt-2 flex flex-col gap-2 bg-white p-3 rounded-xl shadow-xl animate-[fadeIn_0.2s_ease-out]">
          {actions.map((action, index) => (
            <FloatingActionButton
              key={index}
              onClick={() => {
                action.onClick();
                onToggle();
              }}
              icon={action.icon}
              label={action.label}
              variant={action.variant || "primary"}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  );
};

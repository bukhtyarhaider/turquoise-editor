import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoImg from "/src/assets/logo.png";
import { generateFallbackAvatar } from "../utils";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        event.target instanceof Node &&
        !document.querySelector(".group")?.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between p-2 px-6 bg-brand-500 text-white shrink-0 shadow-md">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <img src={logoImg} className="h-8" alt="Turquoise Logo" />
        Turquoise
      </h2>
      <div className="flex items-center gap-3">
        {user && (
          <div className="relative group">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="focus:outline-none"
              aria-label="Open profile menu"
            >
              <img
                src={user.photoURL || generateFallbackAvatar(user.displayName)}
                alt={user.displayName || "User"}
                className="w-10 h-10 rounded-full object-cover border-2 border-brand-200 group-hover:border-brand-300 transition-all duration-200"
                onError={(e) => {
                  e.currentTarget.src = generateFallbackAvatar(
                    user.displayName
                  );
                }}
              />
              <div
                className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-brand-500 group-hover:bg-green-500 transition-all duration-200"
                aria-hidden="true"
              />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50 border border-brand-100 animate-[fadeIn_0.2s_ease-out]">
                <div className="px-4 py-2 text-sm text-brand-700 border-b border-brand-100">
                  {user.displayName || "User"}
                </div>
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      setIsProfileOpen(false);
                    } catch (error) {
                      console.error("Logout failed:", error);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

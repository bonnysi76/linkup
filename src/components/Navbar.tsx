import { Home, MessageCircle, Settings, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/feed" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: User, label: "Profile", path: "/setup" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-3">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors relative",
                isActive ? "text-[#007AFF]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              )}
            >
              <item.icon size={24} fill={isActive ? "currentColor" : "none"} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.label === "Chat" && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white dark:border-black">
                  2
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

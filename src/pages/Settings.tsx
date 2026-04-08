import { Moon, Sun, Shield, User, Bell, ChevronRight } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface SettingsProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function Settings({ isDarkMode, setIsDarkMode }: SettingsProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    sessionStorage.removeItem("is_verified");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-md mx-auto space-y-6">
        <header className="py-4">
          <h1 className="text-3xl font-bold">Settings</h1>
        </header>

        <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-[#2C2C2E] rounded-lg">
                <User size={20} className="text-gray-500" />
              </div>
              <span className="font-medium">Profile</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Bell size={20} className="text-blue-500" />
              </div>
              <span className="font-medium">Notifications</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield size={20} className="text-purple-500" />
              </div>
              <span className="font-medium">Security & PIN</span>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </section>

        <section className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                {isDarkMode ? <Moon size={20} className="text-yellow-500" /> : <Sun size={20} className="text-yellow-500" />}
              </div>
              <span className="font-medium">Dark Mode</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-[#34C759]' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <button 
          onClick={handleLogout}
          className="w-full py-4 text-red-500 font-medium bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}


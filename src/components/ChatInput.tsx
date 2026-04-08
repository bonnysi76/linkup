import { Send, Camera, Mic, Plus } from "lucide-react";
import { useState } from "react";

export function ChatInput() {
  const [message, setMessage] = useState("");

  return (
    <div className="p-2 pb-8 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 max-w-4xl mx-auto">
        <button className="p-2 text-[#007AFF] hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
          <Plus size={24} />
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="iMessage"
            className="w-full py-2 px-4 bg-gray-100 dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-[#007AFF] transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {message ? (
              <button className="p-1.5 bg-[#007AFF] text-white rounded-full hover:bg-[#0066D6] transition-colors">
                <Send size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 px-2">
                <Camera size={20} className="cursor-pointer hover:text-gray-600" />
                <Mic size={20} className="cursor-pointer hover:text-gray-600" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

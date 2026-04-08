import { motion } from "motion/react";
import { cn } from "@/src/lib/utils";
import { Check, CheckCheck, Play, FileText } from "lucide-react";

interface ChatBubbleProps {
  content: string;
  isMe: boolean;
  timestamp: string;
  type?: "text" | "image" | "video" | "voice" | "file";
  mediaUrl?: string;
  status?: "sent" | "delivered" | "seen";
}

export function ChatBubble({ content, isMe, timestamp, type = "text", mediaUrl, status }: ChatBubbleProps) {
  const renderContent = () => {
    switch (type) {
      case "image":
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-black max-w-[240px]">
            <img src={mediaUrl} alt="Shared image" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
            {content && <p className="p-2 text-[15px]">{content}</p>}
          </div>
        );
      case "video":
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-black max-w-[240px]">
            <video src={mediaUrl} controls className="w-full h-auto" />
            {content && <p className="p-2 text-[15px]">{content}</p>}
          </div>
        );
      case "voice":
        return (
          <div className="flex items-center gap-3 py-1 px-2 min-w-[160px]">
            <div className={cn(
              "p-2 rounded-full",
              isMe ? "bg-white/20" : "bg-[#007AFF]/10"
            )}>
              <Play size={18} fill="currentColor" />
            </div>
            <div className="flex-1 h-1 bg-current opacity-20 rounded-full" />
            <span className="text-xs opacity-70">0:05</span>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-xl">
            <FileText size={24} className="text-[#007AFF]" />
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[150px]">{content}</span>
              <span className="text-[10px] opacity-50">Document</span>
            </div>
          </div>
        );
      default:
        return <p className="text-[15px] leading-tight">{content}</p>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "flex flex-col mb-1.5 max-w-[80%]",
        isMe ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "px-4 py-2.5 rounded-[20px] shadow-sm",
          type === "text" || type === "voice" 
            ? (isMe ? "bg-[#007AFF] text-white rounded-br-[4px]" : "bg-[#E9E9EB] dark:bg-[#262629] text-black dark:text-white rounded-bl-[4px]")
            : "bg-transparent p-0"
        )}
      >
        {renderContent()}
      </div>
      <div className="flex items-center gap-1 mt-0.5 px-1">
        <span className="text-[10px] text-gray-400">{timestamp}</span>
        {isMe && status && (
          <div className={cn(
            "text-[10px]",
            status === "seen" ? "text-[#007AFF]" : "text-gray-400"
          )}>
            {status === "sent" ? <Check size={10} /> : <CheckCheck size={10} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

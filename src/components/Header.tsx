import { ChevronLeft, Info, Video, Phone, ShieldCheck } from "lucide-react";

interface HeaderProps {
  name: string;
  avatar?: string;
  onBack?: () => void;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
}

export function Header({ name, avatar, onBack, onVideoCall, onVoiceCall }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-1">
          <button 
            onClick={onBack}
            className="p-1 text-[#007AFF] hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex flex-col items-center">
             <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
               {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name[0]}
             </div>
             <div className="flex items-center gap-1 mt-0.5">
               <span className="text-[11px] font-medium">{name}</span>
               <ShieldCheck size={10} className="text-green-500" />
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[#007AFF]">
          <button onClick={onVideoCall} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button onClick={onVoiceCall} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <Info size={20} className="cursor-pointer" />
        </div>
      </div>
    </header>
  );
}

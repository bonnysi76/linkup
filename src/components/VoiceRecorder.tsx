import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Trash2, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";

interface VoiceRecorderProps {
  onSend: (blob: Blob) => Promise<void>;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSend = async () => {
    if (audioBlob) {
      setIsSending(true);
      try {
        await onSend(audioBlob);
        setAudioBlob(null);
      } catch (err) {
        console.error("Error sending voice note:", err);
      } finally {
        setIsSending(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="flex items-center gap-3 bg-gray-100 dark:bg-[#1C1C1E] p-2 rounded-full w-full"
    >
      <div className="flex-1 flex items-center gap-3 px-2">
        {isRecording ? (
          <>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-red-500"
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </>
        ) : audioBlob ? (
          <div className="flex items-center gap-2 text-[#007AFF]">
            <Play size={18} fill="currentColor" />
            <span className="text-sm font-medium">Voice Note Ready</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Hold to record</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {audioBlob ? (
          <>
            <button 
              onClick={() => setAudioBlob(null)}
              className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleSend}
              disabled={isSending}
              className="p-2 bg-[#007AFF] text-white rounded-full hover:bg-[#0066D6] disabled:opacity-50"
            >
              {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onCancel}
              className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={cn(
                "p-3 rounded-full transition-all",
                isRecording ? "bg-red-500 text-white scale-110" : "bg-[#007AFF] text-white"
              )}
            >
              {isRecording ? <Square size={20} fill="white" /> : <Mic size={20} />}
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, User, Signal, SignalHigh, SignalLow, RefreshCw } from "lucide-react";
import { useCall } from "@/src/hooks/useCall";
import { cn } from "@/src/lib/utils";

export function CallScreen() {
  const { 
    activeCall, 
    incomingCall, 
    localStream, 
    remoteStream, 
    acceptCall, 
    rejectCall, 
    endCall, 
    toggleMute, 
    toggleVideo,
    switchCamera,
    isMuted,
    isVideoOff,
    facingMode
  } = useCall();

  const [duration, setDuration] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<"high" | "medium" | "low">("high");
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  useEffect(() => {
    // Simulate network quality changes
    const interval = setInterval(() => {
      const qualities: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
      const random = Math.random();
      if (random > 0.8) setNetworkQuality(qualities[Math.floor(Math.random() * 3)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getNetworkIcon = () => {
    switch (networkQuality) {
      case "high": return <SignalHigh size={16} className="text-green-500" />;
      case "medium": return <Signal size={16} className="text-yellow-500" />;
      case "low": return <SignalLow size={16} className="text-red-500" />;
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall && !incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white dark:bg-[#1C1C1E] shadow-2xl rounded-3xl p-6 w-[90%] max-w-sm pointer-events-auto border border-gray-100 dark:border-gray-800"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <User size={40} className="text-gray-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold">Incoming {incomingCall.type} Call</h3>
                <p className="text-gray-500">Someone is calling you...</p>
              </div>
              <div className="flex gap-8 mt-4">
                <button
                  onClick={rejectCall}
                  className="w-14 h-14 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <PhoneOff size={24} />
                </button>
                <button
                  onClick={acceptCall}
                  className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Video size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeCall && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 bg-black pointer-events-auto flex flex-col"
          >
            {/* Remote Video (Full Screen) */}
            <div className="relative flex-1 bg-gray-900 overflow-hidden">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center">
                    <User size={64} className="text-gray-600" />
                  </div>
                  <p className="text-white/50 animate-pulse">Connecting...</p>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-6 right-6 w-32 h-48 bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10">
                {localStream && !isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <VideoOff size={24} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Call Info */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center">
                <h2 className="text-white text-xl font-bold drop-shadow-md">
                  {activeCall.type === "video" ? "Video Call" : "Voice Call"}
                </h2>
                <div className="flex items-center gap-3 justify-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-white/70 text-sm font-mono">{formatDuration(duration)}</span>
                  <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {getNetworkIcon()}
                    <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">{networkQuality}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-black/40 backdrop-blur-xl p-8 flex items-center justify-center gap-6">
              <button
                onClick={toggleMute}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                  isMuted ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg"
              >
                <PhoneOff size={28} />
              </button>

              {activeCall.type === "video" && (
                <>
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                      isVideoOff ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"
                    )}
                  >
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </button>

                  <button
                    onClick={switchCamera}
                    className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
                    title="Switch Camera"
                  >
                    <RefreshCw size={24} className={cn(facingMode === "environment" && "rotate-180 transition-transform")} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

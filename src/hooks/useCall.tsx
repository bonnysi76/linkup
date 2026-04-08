import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, setDoc, query, where, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { useAuth } from "@/src/hooks/useAuth";

interface CallContextType {
  isCalling: boolean;
  incomingCall: any | null;
  activeCall: any | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  initiateCall: (recipientId: string, type: "voice" | "video") => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => Promise<void>;
  isMuted: boolean;
  isVideoOff: boolean;
  facingMode: "user" | "environment";
}

const CallContext = createContext<CallContextType | null>(null);

const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const pc = useRef<RTCPeerConnection | null>(null);
  const callDocRef = useRef<any>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "calls"),
      where("participants", "array-contains", user.uid),
      where("status", "==", "ringing")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const callData = change.doc.data();
          if (callData.callerId !== user.uid) {
            setIncomingCall({ id: change.doc.id, ...callData });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user]);

  const setupMedia = async (type: "voice" | "video", mode: "user" | "environment" = "user") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { facingMode: mode } : false,
    });
    setLocalStream(stream);
    return stream;
  };

  const switchCamera = async () => {
    if (!localStream || !activeCall || activeCall.type !== "video") return;

    const newMode = facingMode === "user" ? "environment" : "user";
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { facingMode: newMode }
    });

    const videoTrack = newStream.getVideoTracks()[0];
    const sender = pc.current?.getSenders().find(s => s.track?.kind === "video");
    
    if (sender && videoTrack) {
      await sender.replaceTrack(videoTrack);
      
      // Stop old tracks
      localStream.getVideoTracks().forEach(track => track.stop());
      
      // Create new combined stream
      const combinedStream = new MediaStream([
        ...localStream.getAudioTracks(),
        videoTrack
      ]);
      
      setLocalStream(combinedStream);
      setFacingMode(newMode);
    }
  };

  const initiateCall = async (recipientId: string, type: "voice" | "video") => {
    if (!user) return;
    setIsCalling(true);

    const stream = await setupMedia(type);
    pc.current = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    const callDoc = doc(collection(db, "calls"));
    callDocRef.current = callDoc;

    const offerDescription = await pc.current.createOffer();
    await pc.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await setDoc(callDoc, {
      callerId: user.uid,
      participants: [user.uid, recipientId],
      type,
      status: "ringing",
      offer,
      createdAt: new Date().toISOString(),
    });

    setActiveCall({ id: callDoc.id, callerId: user.uid, participants: [user.uid, recipientId], type });

    // Listen for answer
    onSnapshot(callDoc, (snapshot) => {
      const data = snapshot.data();
      if (!pc.current?.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current?.setRemoteDescription(answerDescription);
      }
      if (data?.status === "ended") {
        cleanup();
      }
    });

    // Handle ICE candidates
    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(callDoc, "callerCandidates"), event.candidate.toJSON());
      }
    };

    onSnapshot(collection(callDoc, "calleeCandidates"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current?.addIceCandidate(candidate);
        }
      });
    });
  };

  const acceptCall = async () => {
    if (!incomingCall || !user) return;

    const stream = await setupMedia(incomingCall.type);
    pc.current = new RTCPeerConnection(servers);

    stream.getTracks().forEach((track) => {
      pc.current?.addTrack(track, stream);
    });

    pc.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    const callDoc = doc(db, "calls", incomingCall.id);
    callDocRef.current = callDoc;

    const offerDescription = incomingCall.offer;
    await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await updateDoc(callDoc, { answer, status: "connected" });

    setActiveCall(incomingCall);
    setIncomingCall(null);
    setIsCalling(true);

    pc.current.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(callDoc, "calleeCandidates"), event.candidate.toJSON());
      }
    };

    onSnapshot(collection(callDoc, "callerCandidates"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.current?.addIceCandidate(candidate);
        }
      });
    });

    onSnapshot(callDoc, (snapshot) => {
      if (snapshot.data()?.status === "ended") {
        cleanup();
      }
    });
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    await updateDoc(doc(db, "calls", incomingCall.id), { status: "ended" });
    setIncomingCall(null);
  };

  const endCall = async () => {
    if (callDocRef.current) {
      await updateDoc(callDocRef.current, { status: "ended" });
    }
    cleanup();
  };

  const cleanup = () => {
    pc.current?.close();
    pc.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIsCalling(false);
    setIncomingCall(null);
    callDocRef.current = null;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <CallContext.Provider
      value={{
        isCalling,
        incomingCall,
        activeCall,
        localStream,
        remoteStream,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        switchCamera,
        isMuted,
        isVideoOff,
        facingMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}

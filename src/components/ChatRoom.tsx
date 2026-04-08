import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/src/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { ChatBubble } from "@/src/components/ChatBubble";
import { VoiceRecorder } from "@/src/components/VoiceRecorder";
import { Header } from "@/src/components/Header";
import { Plus, Send, Smile, Paperclip, Image as ImageIcon, Mic, X, Loader2, Video, Phone, Shield } from "lucide-react";
import { useCall } from "@/src/hooks/useCall";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker from "emoji-picker-react";
import { format } from "date-fns";
import { deriveSharedKey, encryptMessage, decryptMessage } from "@/src/lib/crypto";

interface ChatRoomProps {
  chatId: string;
  recipient: {
    uid: string;
    displayName: string;
    photoURL?: string;
    publicKey?: any;
  };
  onBack: () => void;
}

export function ChatRoom({ chatId, recipient, onBack }: ChatRoomProps) {
  const { user } = useAuth();
  const { initiateCall } = useCall();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sharedKey, setSharedKey] = useState<CryptoKey | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize E2EE Shared Key
  useEffect(() => {
    const initE2EE = async () => {
      if (!user || !recipient.uid) return;
      
      try {
        // Get recipient's public key if not provided
        let recipientPublicKey = recipient.publicKey;
        if (!recipientPublicKey) {
          const userDoc = await getDoc(doc(db, "users", recipient.uid));
          recipientPublicKey = userDoc.data()?.publicKey;
        }

        const privateKeyJwk = JSON.parse(localStorage.getItem(`e2ee_private_key_${user.uid}`) || "null");
        
        if (privateKeyJwk && recipientPublicKey) {
          const key = await deriveSharedKey(privateKeyJwk, recipientPublicKey);
          setSharedKey(key);
        }
      } catch (err) {
        console.error("Failed to initialize E2EE:", err);
      }
    };

    initE2EE();
  }, [user, recipient]);

  useEffect(() => {
    if (!chatId || !user || !sharedKey) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let content = data.content;

        // Decrypt if it's an encrypted message
        if (data.isEncrypted && data.encryptedData && sharedKey) {
          try {
            content = await decryptMessage(data.encryptedData, sharedKey);
          } catch (err) {
            content = "[Decryption Failed]";
          }
        }

        return { id: doc.id, ...data, content };
      }));
      
      setMessages(msgs);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId, sharedKey]);

  const sendMessage = async (content: string, type: "text" | "image" | "video" | "voice" = "text", mediaUrl?: string) => {
    if (!user || (!content && !mediaUrl)) return;
    setIsSending(true);

    try {
      let messageData: any = {
        chatId,
        senderId: user.uid,
        content,
        type,
        mediaUrl: mediaUrl || null,
        status: "sent",
        createdAt: new Date().toISOString(),
      };

      // Encrypt text content if sharedKey exists
      if (sharedKey && content) {
        const encrypted = await encryptMessage(content, sharedKey);
        messageData.encryptedData = encrypted;
        messageData.isEncrypted = true;
        messageData.content = "[Encrypted Message]"; // Fallback for non-E2EE clients
      }

      await addDoc(collection(db, "chats", chatId, "messages"), messageData);
      
      // Update chat last message
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: type === "text" ? (sharedKey ? "Encrypted Message" : content) : `Shared a ${type}`,
        lastMessageAt: new Date().toISOString(),
      });

      setNewMessage("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSending(true);
    try {
      const type = file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "text";
      if (type === "text") {
        alert("Unsupported file type");
        return;
      }

      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await sendMessage("", type as any, url);
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceSend = async (blob: Blob) => {
    if (!user) return;
    const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_voice.webm`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await sendMessage("", "voice", url);
    setShowVoiceRecorder(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
      <Header 
        name={recipient.displayName} 
        avatar={recipient.photoURL} 
        onBack={onBack}
        onVideoCall={() => {
          console.log('Video call initiated');
          initiateCall(recipient.uid, "video");
        }}
        onVoiceCall={() => initiateCall(recipient.uid, "voice")}
      />
      
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hide"
      >
        <div className="flex flex-col justify-end min-h-full">
          {messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDate = !prevMsg || 
              new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 1000 * 60 * 30;

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      {format(new Date(msg.createdAt), "EEEE, h:mm a")}
                    </span>
                  </div>
                )}
                <ChatBubble
                  content={msg.content}
                  isMe={msg.senderId === user?.uid}
                  timestamp={format(new Date(msg.createdAt), "h:mm a")}
                  type={msg.type}
                  mediaUrl={msg.mediaUrl}
                  status={msg.status}
                />
              </React.Fragment>
            );
          })}
        </div>
      </main>

      <footer className="p-2 pb-8 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 relative">
        <AnimatePresence>
          {showVoiceRecorder ? (
            <VoiceRecorder 
              onSend={handleVoiceSend} 
              onCancel={() => setShowVoiceRecorder(false)} 
            />
          ) : (
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-[#007AFF] hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
              >
                <Plus size={24} />
              </button>
              
              <div className="flex-1 relative flex items-center bg-gray-100 dark:bg-[#1C1C1E] rounded-full px-3 py-1 border border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Smile size={20} />
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage(newMessage)}
                  placeholder="iMessage"
                  className="flex-1 bg-transparent border-none focus:ring-0 py-1.5 text-[15px]"
                />
                
                <div className="flex items-center gap-2">
                  {!newMessage && (
                    <>
                      <button 
                        onClick={() => setShowVoiceRecorder(true)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Mic size={20} />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <ImageIcon size={20} />
                      </button>
                    </>
                  )}
                  {newMessage && (
                    <button 
                      onClick={() => sendMessage(newMessage)}
                      disabled={isSending}
                      className="p-1.5 bg-[#007AFF] text-white rounded-full hover:bg-[#0066D6] disabled:opacity-50"
                    >
                      {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 right-0 z-50 p-2">
            <EmojiPicker 
              onEmojiClick={(emoji) => setNewMessage(prev => prev + emoji.emoji)}
              width="100%"
              height={350}
              theme={document.documentElement.classList.contains("dark") ? "dark" : "light" as any}
            />
          </div>
        )}
      </footer>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*,video/*" 
        className="hidden" 
      />
    </div>
  );
}

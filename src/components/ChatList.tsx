import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, setDoc, limit } from "firebase/firestore";
import { db } from "@/src/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { Search, Edit, ChevronRight, User, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";

interface ChatListProps {
  onSelectChat: (chatId: string, recipient: any) => void;
}

export function ChatList({ onSelectChat }: ChatListProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const recipientId = data.participants.find((id: string) => id !== user.uid);
        const recipientDoc = await getDoc(doc(db, "users", recipientId));
        return {
          id: chatDoc.id,
          ...data,
          recipient: { uid: recipientId, ...recipientDoc.data() }
        };
      }));
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }

    // Simplified user search
    const q = query(collection(db, "users"), limit(5));
    const snapshot = await getDocs(q);
    const users = snapshot.docs
      .map(d => ({ uid: d.id, ...d.data() }))
      .filter((u: any) => 
        u.uid !== user?.uid && 
        (u.username?.toLowerCase().includes(val.toLowerCase()) || 
         u.displayName?.toLowerCase().includes(val.toLowerCase()))
      );
    setSearchResults(users);
  };

  const startNewChat = async (recipient: any) => {
    if (!user) return;
    
    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(recipient.uid));
    if (existingChat) {
      onSelectChat(existingChat.id, recipient);
      return;
    }

    const chatId = [user.uid, recipient.uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    
    await setDoc(chatRef, {
      participants: [user.uid, recipient.uid],
      lastMessage: "Started a conversation",
      lastMessageAt: new Date().toISOString(),
      unreadCount: { [user.uid]: 0, [recipient.uid]: 0 }
    });

    onSelectChat(chatId, recipient);
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black">
      <header className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button className="text-[#007AFF] font-medium">Edit</button>
          <h1 className="text-lg font-bold">Messages</h1>
          <button className="text-[#007AFF]">
            <Edit size={20} />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-[#1C1C1E] rounded-xl border-none focus:ring-2 focus:ring-[#007AFF] transition-all"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {searchQuery && searchResults.length > 0 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">People</h3>
            {searchResults.map((u) => (
              <button 
                key={u.uid}
                onClick={() => startNewChat(u)}
                className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] rounded-xl transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {u.photoURL ? <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{u.displayName}</span>
                  <span className="text-xs text-gray-500">@{u.username || "user"}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id, chat.recipient)}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1C1C1E] transition-colors group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                  {chat.recipient.photoURL ? (
                    <img src={chat.recipient.photoURL} alt={chat.recipient.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                      {chat.recipient.displayName[0]}
                    </div>
                  )}
                </div>
                {/* Online indicator placeholder */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-black rounded-full" />
              </div>

              <div className="flex-1 flex flex-col items-start min-w-0">
                <div className="w-full flex items-center justify-between">
                  <span className="font-bold text-[15px]">{chat.recipient.displayName}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-gray-400">
                      {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false }).replace("about ", "")}
                    </span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                </div>
                <p className="text-[14px] text-gray-500 truncate w-full text-left">
                  {chat.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>

        {chats.length === 0 && !loading && !searchQuery && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1C1C1E] rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h3 className="font-bold text-lg">No Messages</h3>
            <p className="text-gray-500 text-sm">Start a conversation with your friends.</p>
          </div>
        )}
      </main>
    </div>
  );
}

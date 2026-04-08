import React, { useState } from "react";
import { ChatList } from "@/src/components/ChatList";
import { ChatRoom } from "@/src/components/ChatRoom";
import { motion, AnimatePresence } from "motion/react";

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState<{ id: string; recipient: any } | null>(null);

  const handleSelectChat = (chatId: string, recipient: any) => {
    setSelectedChat({ id: chatId, recipient });
  };

  const handleBack = () => {
    setSelectedChat(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedChat ? (
          <motion.div
            key="list"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="h-full"
          >
            <ChatList onSelectChat={handleSelectChat} />
          </motion.div>
        ) : (
          <motion.div
            key="room"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="h-full"
          >
            <ChatRoom 
              chatId={selectedChat.id} 
              recipient={selectedChat.recipient} 
              onBack={handleBack} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

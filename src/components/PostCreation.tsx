import React, { useState, useRef } from "react";
import { Image, Video, X, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/src/hooks/useAuth";
import { db, storage } from "@/src/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface PostCreationProps {
  onClose: () => void;
}

export function PostCreation({ onClose }: PostCreationProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<{ file: File; preview: string; type: "image" | "video" } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("File size exceeds 50MB limit.");
      return;
    }

    const type = file.type.startsWith("video") ? "video" : "image";
    const preview = URL.createObjectURL(file);
    setMedia({ file, preview, type });
  };

  const handlePost = async () => {
    if (!user || (!content && !media)) return;
    setIsPosting(true);

    try {
      let mediaUrl = "";
      if (media) {
        const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${media.file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, media.file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              mediaUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(null);
            }
          );
        });
      }

      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile?.username || user.displayName || "Anonymous",
        authorPhoto: user.photoURL || "",
        content,
        mediaUrl,
        mediaType: media?.type || null,
        likeCount: 0,
        commentCount: 0,
        createdAt: new Date().toISOString(),
      });

      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsPosting(false);
      setUploadProgress(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X size={24} />
          </button>
          <h3 className="font-bold text-lg">New Post</h3>
          <button 
            onClick={handlePost}
            disabled={isPosting || (!content && !media)}
            className="bg-[#007AFF] text-white px-4 py-1.5 rounded-full font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            {isPosting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Post
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none min-h-[120px]"
          />

          <AnimatePresence>
            {media && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-black"
              >
                {media.type === "video" ? (
                  <video src={media.preview} className="w-full h-auto" controls />
                ) : (
                  <img src={media.preview} alt="Preview" className="w-full h-auto" />
                )}
                <button 
                  onClick={() => setMedia(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {uploadProgress !== null && (
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className="bg-[#007AFF] h-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#2C2C2E] flex items-center gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#007AFF] transition-colors"
          >
            <Image size={24} />
            <span className="text-sm font-medium">Photo</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#007AFF] transition-colors"
          >
            <Video size={24} />
            <span className="text-sm font-medium">Video</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>
      </div>
    </motion.div>
  );
}

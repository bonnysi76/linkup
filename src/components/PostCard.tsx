import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/src/lib/utils";

interface PostCardProps {
  post: {
    id: string;
    authorName: string;
    authorPhoto: string;
    content: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    likeCount: number;
    commentCount: number;
    createdAt: string;
  };
  isLiked?: boolean;
  onLike?: () => void;
}

export function PostCard({ post, isLiked = false, onLike }: PostCardProps) {
  const [showHeart, setShowHeart] = useState(false);

  const handleDoubleClick = () => {
    if (!isLiked && onLike) {
      onLike();
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            {post.authorPhoto ? (
              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                {post.authorName[0]}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px]">{post.authorName}</span>
            <span className="text-[11px] text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </span>
          </div>
        </div>
        <button className="text-gray-400">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.mediaUrl && (
        <div 
          className="relative aspect-square bg-gray-100 dark:bg-black overflow-hidden cursor-pointer"
          onDoubleClick={handleDoubleClick}
        >
          {post.mediaType === "video" ? (
            <video 
              src={post.mediaUrl} 
              className="w-full h-full object-cover" 
              controls 
              muted 
              loop
            />
          ) : (
            <img 
              src={post.mediaUrl} 
              alt="Post content" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          )}
          
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart size={80} fill="white" className="text-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            )}
          >
            <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
            <span className="text-sm font-medium">{post.likeCount}</span>
          </button>
          
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors">
            <MessageCircle size={22} />
            <span className="text-sm font-medium">{post.commentCount}</span>
          </button>
          
          <button className="text-gray-500 hover:text-green-500 transition-colors">
            <Share2 size={22} />
          </button>
        </div>
        
        <button className="text-gray-500 hover:text-yellow-500 transition-colors">
          <Bookmark size={22} />
        </button>
      </div>
    </div>
  );
}

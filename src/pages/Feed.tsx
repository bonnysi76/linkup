import { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, limit, onSnapshot, startAfter, getDocs, doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { useAuth } from "@/src/hooks/useAuth";
import { PostCard } from "@/src/components/PostCard";
import { PostCreation } from "@/src/components/PostCreation";
import { Plus, RefreshCw, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion, AnimatePresence } from "motion/react";

const POSTS_PER_PAGE = 10;

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // Initial fetch and real-time listener for new posts
  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(newPosts);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
      setLoading(false);
    }, (error) => {
      console.error("Feed error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch user's likes
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "likes"), orderBy("userId"), limit(100)); // Simplified
    // In a real app, you'd filter by userId and use a listener
    const fetchLikes = async () => {
      const snapshot = await getDocs(collection(db, "likes")); // Simplified for demo
      const userLikes = new Set(snapshot.docs.filter(d => d.data().userId === user.uid).map(d => d.data().postId));
      setLikedPosts(userLikes);
    };
    fetchLikes();
  }, [user]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(POSTS_PER_PAGE)
      );
      
      const snapshot = await getDocs(q);
      const morePosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setPosts(prev => [...prev, ...morePosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, hasMore]);

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView, loadMore]);

  const handleLike = async (postId: string) => {
    if (!user) return;
    const likeId = `${user.uid}_${postId}`;
    const likeRef = doc(db, "likes", likeId);
    const postRef = doc(db, "posts", postId);

    try {
      if (likedPosts.has(postId)) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likeCount: increment(-1) });
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          postId,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(postRef, { likeCount: increment(1) });
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <button 
            onClick={() => window.location.reload()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors"
          >
            <RefreshCw size={20} className="text-gray-500" />
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto">
        <div className="flex flex-col">
          {posts.map((post) => (
            <div key={post.id}>
              <PostCard
                post={post}
                isLiked={likedPosts.has(post.id)}
                onLike={() => handleLike(post.id)}
              />
            </div>
          ))}
        </div>

        {hasMore && (
          <div ref={ref} className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </main>

      <button 
        onClick={() => setShowPostCreation(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#007AFF] text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        <Plus size={28} />
      </button>

      <AnimatePresence>
        {showPostCreation && (
          <PostCreation onClose={() => setShowPostCreation(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from "react";
import { motion } from "motion/react";
import { User, Camera, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/src/firebase";
import { generateKeyPair } from "@/src/lib/crypto";

export default function ProfileSetup() {
  const { user, profile } = useAuth();
  const [username, setUsername] = useState(profile?.username || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleComplete = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Generate E2EE keys
      const { publicKey, privateKey } = await generateKeyPair();
      
      // Store private key locally (in a real app, this would be encrypted with a user password)
      localStorage.setItem(`e2ee_private_key_${user.uid}`, JSON.stringify(privateKey));

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        username,
        bio,
        isSetupComplete: true,
        publicKey, // Store public key for others to encrypt messages for this user
      });
      navigate("/feed");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-6">
      <div className="max-w-md mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Profile Setup</h1>
          <p className="text-gray-500">Tell us a bit about yourself.</p>
        </header>

        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-[#1C1C1E] flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-[#007AFF] text-white rounded-full shadow-lg hover:scale-110 transition-transform">
              <Camera size={20} />
            </button>
          </div>
          <span className="text-sm text-[#007AFF] font-medium cursor-pointer">Upload Photo</span>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_rivera"
              className="w-full p-3 bg-gray-100 dark:bg-[#1C1C1E] rounded-xl border-none focus:ring-2 focus:ring-[#007AFF] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A short bio..."
              className="w-full p-3 bg-gray-100 dark:bg-[#1C1C1E] rounded-xl border-none focus:ring-2 focus:ring-[#007AFF] transition-all h-24 resize-none"
            />
          </div>

          <button 
            onClick={handleComplete}
            disabled={isSubmitting || !username}
            className="w-full flex items-center justify-center gap-2 bg-[#007AFF] text-white py-4 rounded-xl font-semibold hover:bg-[#0066D6] transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Continue"}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}


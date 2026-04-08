import { LogIn, Loader2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/src/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Login() {
  const { signIn, user, profile, loading, authError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      if (!profile.isSetupComplete) {
        navigate("/setup");
      } else {
        navigate("/feed");
      }
    }
  }, [user, profile, navigate]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#0A0A0A]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md space-y-8 text-center"
      >
        <div className="space-y-2">
          <div className="w-20 h-20 bg-[#007AFF] rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-blue-500/20">
            <LogIn className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-gray-500 dark:text-gray-400">Secure. Simple. Yours.</p>
        </div>

        <div className="space-y-4">
          {authError && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
              <AlertCircle size={16} />
              <p>{authError}</p>
            </div>
          )}

          <button 
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-[#1C1C1E] text-black dark:text-white border border-gray-200 dark:border-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-[#2C2C2E] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            )}
            {isSigningIn ? "Signing in..." : "Sign in with Google"}
          </button>
          
          <p className="text-[11px] text-gray-400 px-8">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
}


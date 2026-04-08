/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { AuthProvider } from "./hooks/useAuth";
import { CallProvider } from "./hooks/useCall";
import { AuthGuard } from "./components/AuthGuard";
import { Navbar } from "./components/Navbar";
import { CallScreen } from "./components/CallScreen";
import { motion, AnimatePresence } from "motion/react";

import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('dark_mode');
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('dark_mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <CallProvider>
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
          <Router>
            <AppContent isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
            <CallScreen />
          </Router>
        </div>
      </CallProvider>
    </AuthProvider>
  );
}

function AppContent({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void }) {
  const location = useLocation();
  const hideNav = ["/login", "/setup"].includes(location.pathname);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={<AuthGuard><ProfileSetup /></AuthGuard>} />
            <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
            <Route path="/chat" element={<AuthGuard><Chat /></AuthGuard>} />
            <Route path="/settings" element={<AuthGuard><Settings setIsDarkMode={setIsDarkMode} isDarkMode={isDarkMode} /></AuthGuard>} />
            <Route path="/" element={<Navigate to="/feed" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!hideNav && <Navbar />}
    </>
  );
}





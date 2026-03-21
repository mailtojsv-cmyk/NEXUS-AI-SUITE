'use client';

import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { getCurrentUser } from './lib/auth';

// Components (will create next)
import AuthPage from './components/Auth/AuthPage';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import TermsPopup from './components/Auth/TermsPopup';
import FloatingTools from './components/Layout/FloatingTools';
import Notifications from './components/Layout/Notifications';

// Tools (will create in Part 2)
import PythonIDE from './components/Tools/PythonIDE';
import RoboBuilder from './components/Tools/RoboBuilder';
import SmartCanvas from './components/Tools/SmartCanvas';
import ChatInterface from './components/AI/ChatInterface';
import AdminPanel from './components/Admin/AdminPanel';

export default function Home() {
  const { user, setUser, currentTool, sidebarOpen, showTermsPopup, setShowTermsPopup } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Show terms popup if user hasn't accepted
      if (currentUser && !currentUser.accepted_terms) {
        setShowTermsPopup(true);
      }
      
      setLoading(false);
    }

    loadUser();
  }, [setUser, setShowTermsPopup]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <div className="text-2xl font-bold gradient-text">Loading Nexus AI...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Sidebar />
      
      <div className="main-content">
        <TopBar />

        <div className="mt-6">
          {currentTool === 'python-ide' && <PythonIDE />}
          {currentTool === 'robo-builder' && <RoboBuilder />}
          {currentTool === 'smart-canvas' && <SmartCanvas />}
          {currentTool === 'chat' && <ChatInterface />}
          {currentTool === 'admin' && <AdminPanel />}
          {/* More tools in Part 2 */}
        </div>
      </div>

      <FloatingTools />
      <Notifications />
      
      {showTermsPopup && <TermsPopup />}
    </>
  );
}

'use client';

import { useStore } from '@/app/lib/store';
import { logout } from '@/app/lib/auth';
import { useState } from 'react';

const AI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (FREE)', free: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (FREE)', free: true },
  { id: 'gpt-4o', name: 'GPT-4o (PREMIUM)', premium: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (PREMIUM)', premium: true },
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (PREMIUM)', premium: true },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', free: true },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', free: true },
];

export default function TopBar() {
  const { user, currentModel, setCurrentModel, setSidebarOpen, notifications } = useStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="glass rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Model Selector */}
      <select
        value={currentModel}
        onChange={(e) => setCurrentModel(e.target.value)}
        className="glass px-4 py-2 rounded-lg border border-cyan-500/30 bg-transparent text-sm"
      >
        {AI_MODELS.map((model) => (
          <option
            key={model.id}
            value={model.id}
            className="bg-gray-900"
            disabled={model.premium && user?.role === 'free'}
          >
            {model.name} {model.premium && user?.role === 'free' ? '🔒' : ''}
          </option>
        ))}
      </select>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm">
              {user?.name?.[0] || 'U'}
            </div>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 glass-strong rounded-lg border border-cyan-500/30 p-2 z-50">
              <div className="p-3 border-b border-cyan-500/20">
                <div className="font-semibold">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left p-3 hover:bg-white/10 rounded text-sm text-red-400 mt-2"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

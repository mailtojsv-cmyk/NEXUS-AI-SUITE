'use client';

import { useStore } from '@/app/lib/store';
import { isSuperAdmin, isModerator, isPremium } from '@/app/lib/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

const TOOLS = [
  { id: 'python-ide', name: '⚡ Python IDE', desc: 'AI-powered coding' },
  { id: 'robo-builder', name: '🤖 RoboBuilder', desc: '3D robot designer' },
  { id: 'smart-canvas', name: '🎨 Smart Canvas', desc: 'AI predictions' },
  { id: 'chat', name: '💬 AI Chat', desc: '150+ models' },
  { id: 'study', name: '📖 Study Helper', desc: 'CBSE/Board help' },
  { id: 'advisors', name: '👨‍🏫 Advisors', desc: 'Mentors' },
  { id: 'tools', name: '🧰 Utilities', desc: 'Calculator, etc.' },
  { id: 'team', name: '👥 Collaborate', desc: 'Team rooms', premium: true },
];

export default function Sidebar() {
  const { user, currentTool, setCurrentTool, sidebarOpen, setSidebarOpen } = useStore();
  const [ad, setAd] = useState<any>(null);

  useEffect(() => {
    loadAd();
  }, [user]);

  const loadAd = async () => {
    // Only show ads to free users
    if (isPremium(user)) return;

    try {
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setAd(data);
    } catch (err) {
      // No ads available
    }
  };

  const handleAdClick = async () => {
    if (!ad) return;

    // Increment click count
    await supabase
      .from('advertisements')
      .update({ clicks: ad.clicks + 1 })
      .eq('id', ad.id);

    // Open link
    window.open(ad.click_url, '_blank');
  };

  const adminTools = isSuperAdmin(user) || isModerator(user)
    ? [{ id: 'admin', name: '⚙️ Admin Panel', desc: 'Manage platform' }]
    : [];

  const allTools = [...TOOLS, ...adminTools];

  return (
    <div className={`sidebar glass ${sidebarOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/20">
        <h1 className="text-2xl font-bold gradient-text">NEXUS AI SUITE</h1>
        <p className="text-xs text-gray-400 mt-1">Free for Students</p>
      </div>

      {/* Tools */}
      <div className="px-4 py-6 space-y-2">
        {allTools.map((tool) => {
          const isPremiumTool = tool.premium && !isPremium(user);

          return (
            <button
              key={tool.id}
              onClick={() => {
                if (isPremiumTool) {
                  alert('⭐ This is a Premium feature. Upgrade to access!');
                  setCurrentTool('premium');
                } else {
                  setCurrentTool(tool.id);
                  setSidebarOpen(false);
                }
              }}
              className={`w-full text-left p-3 rounded-lg transition ${
                currentTool === tool.id
                  ? 'bg-cyan-500/20 border border-cyan-500/50 glow'
                  : 'hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{tool.name}</div>
                  <div className="text-xs text-gray-400">{tool.desc}</div>
                </div>
                {isPremiumTool && <span className="premium-badge">PRO</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* Advertisement Section (FREE USERS ONLY) */}
      {!isPremium(user) && ad && (
        <div className="px-4 py-4 border-t border-cyan-500/20">
          <div className="text-xs text-gray-400 mb-2">Sponsored</div>
          <div
            onClick={handleAdClick}
            className="glass p-3 rounded-lg cursor-pointer hover:glow transition"
          >
            <img
              src={ad.image_url}
              alt="Advertisement"
              className="w-full rounded mb-2"
            />
            <div className="text-xs text-gray-400">Click to learn more →</div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="absolute bottom-4 left-4 right-4 space-y-2">
        <div className="p-3 glass rounded-lg border border-cyan-500/30">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isSuperAdmin(user)
                  ? 'bg-gradient-to-br from-purple-400 to-pink-500'
                  : isPremium(user)
                  ? 'bg-gradient-to-br from-green-400 to-blue-500'
                  : 'bg-gradient-to-br from-cyan-400 to-blue-500'
              }`}
            >
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>

        <div
          className={`p-3 glass rounded-lg border ${
            isSuperAdmin(user)
              ? 'border-purple-500/30 bg-purple-500/10'
              : isPremium(user)
              ? 'border-green-500/30 bg-green-500/10'
              : 'border-gray-500/30'
          }`}
        >
          <div className="text-xs text-gray-400">Account</div>
          <div
            className={`text-sm font-semibold ${
              isSuperAdmin(user)
                ? 'text-purple-400'
                : isPremium(user)
                ? 'text-green-400'
                : 'text-gray-400'
            }`}
          >
            {isSuperAdmin(user)
              ? '👑 SUPER ADMIN'
              : isModerator(user)
              ? '🛡️ MODERATOR'
              : isPremium(user)
              ? '✨ PREMIUM'
              : '🆓 FREE'}
          </div>
          {!isPremium(user) && (
            <button
              onClick={() => setCurrentTool('premium')}
              className="mt-2 w-full btn btn-primary text-xs"
            >
              Upgrade to Premium
            </button>
          )}
        </div>
      </div>
    </div>
  );
                }

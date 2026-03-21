'use client';

import { useState } from 'react';
import { sendMagicLink, loginWithPassword, signUpWithPassword } from '@/app/lib/auth';
import { useStore } from '@/app/lib/store';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const { setUser, addNotification } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginWithPassword(email, password);

    if (result.success && result.user) {
      setUser(result.user);
      addNotification({
        type: 'success',
        message: `Welcome back, ${result.user.name}! 🎉`,
      });
    } else {
      setError(result.error || 'Login failed');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const result = await signUpWithPassword(email, password, name);

    if (result.success && result.user) {
      setUser(result.user);
      addNotification({
        type: 'success',
        message: `Account created! Welcome ${result.user.name}! 🎉`,
      });
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await sendMagicLink(email);

    if (result.success) {
      setMagicLinkSent(true);
      addNotification({
        type: 'info',
        message: 'Magic link sent! Check your email 📧',
      });
    } else {
      setError(result.error || 'Failed to send magic link');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 gradient-text">
            NEXUS AI SUITE
          </h1>
          <p className="text-gray-400">Free AI Tools for Indian Students</p>
        </div>

        {/* Auth Form */}
        <div className="glass-strong p-8 rounded-2xl">
          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'login' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'signup' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 rounded-lg transition ${
                mode === 'magic' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" className="w-full btn btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button type="submit" className="w-full btn btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>
          )}

          {/* Magic Link Form */}
          {mode === 'magic' && (
            <>
              {magicLinkSent ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📧</div>
                  <h3 className="text-xl font-bold mb-2">Check your email!</h3>
                  <p className="text-gray-400 text-sm">
                    We've sent a magic link to <strong>{email}</strong>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click the link in the email to login instantly.
                  </p>
                  <button
                    onClick={() => setMagicLinkSent(false)}
                    className="mt-6 btn btn-secondary text-sm"
                  >
                    Send another link
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      We'll send you a magic link to login without password
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button type="submit" className="w-full btn btn-primary" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          <div>🎓 Made for School Students</div>
          <div className="mt-1">✨ 100% Free • No Credit Card Required</div>
        </div>
      </div>
    </div>
  );
                    }

import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { X, Lock, Mail, User, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const normalizeEmail = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed.includes('@')) {
      // Allow username-only input by appending default domain
      return `${trimmed.toLowerCase().replace(/[^a-z0-9_.]/g, '')}@pantrypal.app`;
    }
    return trimmed;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const name = displayName.trim();
        const email = emailOrUsername.trim();

        if (!name) {
          throw new Error('Please enter your name.');
        }
        if (!email || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }
        if (!password) {
          throw new Error('Please enter a password.');
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, {
          displayName: name,
          photoURL: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?auto=format&fit=crop&w=200&q=80`
        });
      } else if (mode === 'login') {
        if (!emailOrUsername.trim()) {
          throw new Error('Please enter your username or email address.');
        }
        if (!password) {
          throw new Error('Please enter your password.');
        }
        const email = normalizeEmail(emailOrUsername);
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        if (!emailOrUsername.trim()) {
          throw new Error('Please enter your email address.');
        }
        const email = normalizeEmail(emailOrUsername);
        await sendPasswordResetEmail(auth, email);
        setInfoMessage('Password reset link sent! Check your inbox.');
        setLoading(false);
        return;
      }

      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid username/email or password. Please try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists. Try logging in!';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Firebase requires a password of at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.message && (err.message.includes('closing') || err.message.includes('hidden') || err.message.includes('IndexedDB') || err.code === 'auth/internal-error')) {
        msg = 'Browser storage restriction detected in preview mode. Memory persistence mode activated — please click Sign In again.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      let msg = err.message || 'Google Sign-In failed.';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Popup was blocked by your browser. Please allow popups or open the app in a new tab.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in popup was closed before completing.';
      } else if (err.message && (err.message.includes('closing') || err.message.includes('hidden') || err.message.includes('IndexedDB'))) {
        msg = 'Browser storage restriction in embedded view. Try opening the app in a new browser tab or use username sign-in.';
      }
      setError(msg);
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInAnonymously(auth);
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Guest Sign-In error:', err);
      setError('Guest login failed. Try refreshing or logging in with a username.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E5E3D8] flex flex-col">
        {/* Header */}
        <div className="bg-[#5A5A40] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-amber-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 rounded-2xl text-amber-200">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="serif-heading text-2xl font-bold tracking-tight">
                {mode === 'login' && 'Sign In to PantryPal'}
                {mode === 'signup' && 'Create Your Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-[#E8E6DC] font-sans mt-0.5">
                Privately save recipes, custom system prompts & meal plans
              </p>
            </div>
          </div>

          {/* Sub-navigation Tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-2 mt-5 bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === 'login' ? 'bg-white text-[#5A5A40] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  mode === 'signup' ? 'bg-white text-[#5A5A40] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-[#D47A5F]/10 border border-[#D47A5F]/30 p-3 rounded-2xl flex items-start gap-2 text-xs text-[#B55F46] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="bg-[#5A5A40]/10 border border-[#5A5A40]/30 p-3 rounded-2xl flex items-start gap-2 text-xs text-[#5A5A40] font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-[#575752] block mb-1">
                  Full Name <span className="text-[#D47A5F]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#88886C] absolute left-3 top-3" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Chef Alex"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[#575752] block mb-1">
                {mode === 'signup' ? (
                  <>Email Address <span className="text-[#D47A5F]">*</span></>
                ) : (
                  'Username or Email'
                )}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#88886C] absolute left-3 top-3" />
                <input
                  type={mode === 'signup' ? 'email' : 'text'}
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder={mode === 'signup' ? 'e.g. alex@example.com' : 'Username (e.g. alex) or email address'}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
                  required
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#575752]">
                    Password {mode === 'signup' && <span className="text-[#D47A5F]">*</span>}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] font-semibold text-[#5A5A40] hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#88886C] absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF9F5] border border-[#E5E3D8] rounded-xl text-xs text-[#1C1C1C] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#42422F] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4 text-amber-200" /> Sign In securely
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4 text-amber-200" /> Create Account
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-[#5A5A40] font-bold hover:underline"
            >
              ← Back to Sign In
            </button>
          )}

          {mode !== 'forgot' && (
            <>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[#E5E3D8]"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-[#88886C] uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-[#E5E3D8]"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="px-3 py-2 bg-white border border-[#E5E3D8] hover:bg-[#FAF9F5] text-[#1C1C1C] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-2xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>

                {/* Quick Guest/Demo Login */}
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  disabled={loading}
                  className="px-3 py-2 bg-[#F5F5F0] hover:bg-[#E8E6DC] text-[#575752] border border-[#E5E3D8] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Guest Demo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

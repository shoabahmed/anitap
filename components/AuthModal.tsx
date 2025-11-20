import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { AuthView } from '../types';
import { X, Mail, Key, LogIn, UserPlus, Wand2, HelpCircle, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: AuthView;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'signIn' }) => {
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      // Reset state on open
      setEmail('');
      setPassword('');
      setMessage('');
      setError('');
    }
  }, [isOpen, initialView]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      let response;
      switch (view) {
        case 'signIn':
          response = await supabase.auth.signInWithPassword({ email, password });
          break;
        case 'signUp':
          response = await supabase.auth.signUp({ email, password });
          if (!response.error) setMessage('Account created! Please check your email to verify.');
          break;
        case 'magicLink':
          response = await supabase.auth.signInWithOtp({ email });
          if (!response.error) setMessage('Check your email for the magic link!');
          break;
        case 'forgotPassword':
          response = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: window.location.origin,
          });
          if (!response.error) setMessage('Password reset link sent! Check your email.');
          break;
      }
      if (response?.error) throw response.error;
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const titles = {
    signIn: 'Welcome Back',
    signUp: 'Create Account',
    magicLink: 'Sign in with Email',
    forgotPassword: 'Reset Password'
  };

  const descriptions = {
    signIn: 'Sign in to access your watchlist and progress.',
    signUp: 'Join AniStream to create your personal anime list.',
    magicLink: 'Enter your email to receive a secure, one-time sign-in link.',
    forgotPassword: "Enter your email and we'll send instructions to reset your password."
  };

  const renderFormContent = () => {
    switch (view) {
      case 'signIn':
      case 'signUp':
        return (
          <>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant/50" size={18} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-surfaceVariant/10 border border-white/5 text-onSurface rounded-xl pl-11 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant/50" size={18} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-surfaceVariant/10 border border-white/5 text-onSurface rounded-xl pl-11 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </>
        );
      case 'magicLink':
      case 'forgotPassword':
        return (
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-onSurfaceVariant/50" size={18} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-surfaceVariant/10 border border-white/5 text-onSurface rounded-xl pl-11 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderFooter = () => {
    switch (view) {
      case 'signIn':
        return (
          <>
            <button type="button" onClick={() => setView('forgotPassword')} className="text-xs text-onSurfaceVariant hover:text-primary transition-colors">Forgot password?</button>
            <p className="text-xs text-onSurfaceVariant">
              No account? <button type="button" onClick={() => setView('signUp')} className="font-bold text-primary hover:underline">Sign up</button>
            </p>
          </>
        );
      case 'signUp':
        return (
          <p className="text-xs text-onSurfaceVariant text-center">
            Have an account? <button type="button" onClick={() => setView('signIn')} className="font-bold text-primary hover:underline">Sign in</button>
          </p>
        );
      case 'magicLink':
      case 'forgotPassword':
        return (
           <p className="text-xs text-onSurfaceVariant text-center">
            Remembered your password? <button type="button" onClick={() => setView('signIn')} className="font-bold text-primary hover:underline">Sign in</button>
          </p>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-[#201E24] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-onSurfaceVariant/50 hover:bg-white/10 hover:text-white rounded-full transition-colors z-20">
              <X size={20} />
            </button>
            
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">{titles[view]}</h2>
                <p className="text-sm text-onSurfaceVariant max-w-xs mx-auto">{descriptions[view]}</p>
            </div>

            <div className="px-8 pb-8 flex flex-col gap-4">
                <form onSubmit={handleAuthAction} className="space-y-4">
                    {renderFormContent()}
                    
                    {message && <p className="text-sm text-green-400 text-center py-2">{message}</p>}
                    {error && <p className="text-sm text-error text-center py-2">{error}</p>}
                    
                    <button type="submit" disabled={loading} className="w-full bg-primary text-onPrimary font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            view === 'signIn' ? 'Sign In' :
                            view === 'signUp' ? 'Create Account' :
                            'Continue'
                        )}
                    </button>
                </form>

                {view === 'signIn' && (
                    <>
                        <div className="flex items-center gap-2 my-2">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs text-onSurfaceVariant/50">OR</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>
                        <button onClick={() => setView('magicLink')} className="w-full flex items-center justify-center gap-2 py-3 bg-surfaceVariant/20 text-onSurface text-sm font-bold rounded-xl border border-white/5 hover:bg-surfaceVariant/40 transition-colors">
                            <Wand2 size={16} /> Sign in with Magic Link
                        </button>
                    </>
                )}

                <div className={`mt-4 flex ${view === 'signIn' ? 'justify-between' : 'justify-center'} items-center`}>
                    {renderFooter()}
                </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
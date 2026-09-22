import React, { useState } from 'react';
import {
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  requestMagicLink,
  verifyAuthOtp,
  AuthSessionData,
  MagicLinkResponse,
} from '../services/api.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSessionData) => void;
  initialEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [linkInfo, setLinkInfo] = useState<MagicLinkResponse | null>(null);

  if (!isOpen) return null;

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await requestMagicLink(email.trim());
      if (res.success) {
        setLinkInfo(res);
        setStep('OTP');
      } else {
        setErrorMsg('Failed to generate magic link. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error requesting sign in link.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await verifyAuthOtp(email.trim(), otp.trim());
      if (res.success && res.session) {
        // Save session locally
        localStorage.setItem('stagegate_auth_session', JSON.stringify(res.session));
        onSuccess(res.session);
        onClose();
      } else {
        setErrorMsg(
          res.error === 'INVALID_OTP'
            ? `Invalid code. ${res.remainingAttempts ?? 0} attempts remaining.`
            : res.error === 'TOO_MANY_ATTEMPTS'
            ? 'Too many failed attempts. Please request a new link.'
            : 'Verification failed. Please try again.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevAutoFill = () => {
    if (linkInfo?.previewOtp) {
      setOtp(linkInfo.previewOtp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl space-y-6 text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Glyph */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
            {step === 'EMAIL' ? <Mail className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {step === 'EMAIL' ? 'Founder Passwordless Access' : 'Enter 6-Digit Code'}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {step === 'EMAIL'
              ? 'Zero passwords to remember. Instant magic link & OTP authentication.'
              : `We sent a one-time login code to ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'EMAIL' ? (
          <form onSubmit={handleRequestMagicLink} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Founder Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@venture.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-glow-indigo transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Secure Link...</span>
                </>
              ) : (
                <>
                  <span>Send Magic Link & Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-DIGIT OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">One-Time Verification Code</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {linkInfo?.previewOtp && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dev Sandbox Code: <strong className="font-mono">{linkInfo.previewOtp}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleDevAutoFill}
                  className="text-[11px] underline hover:text-emerald-200 font-semibold cursor-pointer"
                >
                  Autofill
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-glow-indigo transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Enter Cockpit</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => { setStep('EMAIL'); setOtp(''); }}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
            >
              ← Use a different email
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-slate-800 flex items-center justify-center space-x-2 text-[10px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Stage Gate OS Cryptographic Identity</span>
        </div>

      </div>
    </div>
  );
};

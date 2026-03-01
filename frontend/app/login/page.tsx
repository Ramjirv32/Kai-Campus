'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { login, requestPasswordReset, verifyOTP, resetPassword } from '@/lib/api';

type Step = 'login' | 'forgot' | 'otp' | 'reset';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [step, setStep] = useState<Step>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await login(email, password);
      const data = resp.data || resp; // Handle both wrapped and unwrapped response
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('authChange'));

      // If user came from a referral link, redirect back to that event page with ref preserved
      const pendingRaw = localStorage.getItem('pendingReferral');
      if (pendingRaw) {
        try {
          const { eventId, ref } = JSON.parse(pendingRaw);
          localStorage.removeItem('pendingReferral');
          router.push(`/events/${eventId}?ref=${encodeURIComponent(ref)}`);
          return;
        } catch {
          localStorage.removeItem('pendingReferral');
        }
      }

      if (redirect) {
        router.push(decodeURIComponent(redirect));
      } else if (data.user?.role === 'campus_captain' || data.user?.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/events');
      }
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess('OTP sent to your email!');
      setStep('otp');
    } catch {
      setError('Could not send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      setSuccess('OTP verified!');
      setStep('reset');
    } catch {
      setError('Invalid OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      setSuccess('Password reset! Please sign in.');
      setStep('login');
    } catch {
      setError('Reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-8">
      {/* Step: Login */}
      {step === 'login' && (
        <>
          <h2 className="text-2xl font-black text-black mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-6">Welcome back to Kai Campus Hub</p>
          {error && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{error}</p>}
          {success && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{success}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-gray-800 text-white font-bold transition-colors disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
            </button>
          </form>
          <button
            onClick={() => { setStep('forgot'); setError(''); setSuccess(''); }}
            className="mt-4 text-sm text-gray-500 hover:text-black transition-colors w-full text-center"
          >
            Forgot password?
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">
            Don&apos;t have an account?{' '}
            <Link
              href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"}
              className="text-black underline font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </>
      )}

      {/* Step: Forgot */}
      {step === 'forgot' && (
        <>
          <h2 className="text-2xl font-black text-black mb-1">Reset Password</h2>
          <p className="text-gray-500 text-sm mb-6">We&apos;ll send an OTP to your email.</p>
          {error && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{error}</p>}
          <form onSubmit={handleForgot} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold transition-colors disabled:opacity-60">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
          <button onClick={() => setStep('login')} className="mt-4 text-sm text-gray-500 hover:text-black transition-colors w-full text-center">
            ← Back to Sign In
          </button>
        </>
      )}

      {/* Step: OTP */}
      {step === 'otp' && (
        <>
          <h2 className="text-2xl font-black text-black mb-1">Enter OTP</h2>
          <p className="text-gray-500 text-sm mb-6">Check your email for the 6-digit code.</p>
          {error && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{error}</p>}
          {success && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{success}</p>}
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-center text-2xl font-mono tracking-widest"
            />
            <button type="submit" disabled={loading} className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold transition-colors disabled:opacity-60">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </>
      )}

      {/* Step: Reset */}
      {step === 'reset' && (
        <>
          <h2 className="text-2xl font-black text-black mb-1">New Password</h2>
          <p className="text-gray-500 text-sm mb-6">Choose a strong password.</p>
          {error && <p className="text-gray-700 text-sm mb-4 border border-gray-300 bg-gray-50 px-4 py-3">{error}</p>}
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold transition-colors disabled:opacity-60">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <span className="font-extrabold text-black text-xl">KaiCampus</span>
        </div>

        <Suspense fallback={
          <div className="bg-white border border-gray-200 p-8 flex items-center justify-center min-h-[400px]">
            <RefreshCw className="w-8 h-8 animate-spin text-black" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

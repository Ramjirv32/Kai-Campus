'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, BookOpen, Eye, EyeOff, ArrowRight, RefreshCw } from 'lucide-react';
import { signup, verifyOTP, login } from '@/lib/api';

const DEPARTMENTS = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'MBA',
  'MCA',
  'Other',
];

type Step = 'signup' | 'otp';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [step, setStep] = useState<Step>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('student');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await signup(name, email, password, department, role);
      setSuccess(data.message || 'OTP sent to your email!');
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Try again.');
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
      setSuccess('Email verified! Logging you in...');

      // Auto login after verification
      const loginData = await login(email, password);
      const autoToken = loginData.data?.token || loginData.token;
      localStorage.setItem('token', autoToken);
      localStorage.setItem('user', JSON.stringify(loginData.data?.user || loginData.user));
      window.dispatchEvent(new Event('authChange'));

      // If user came from a referral link, redirect back to that event page with ref preserved
      const pendingRaw = localStorage.getItem('pendingReferral');
      if (pendingRaw) {
        try {
          const { eventId, ref } = JSON.parse(pendingRaw);
          localStorage.removeItem('pendingReferral');
          setTimeout(() => router.push(`/events/${eventId}?ref=${encodeURIComponent(ref)}`), 1000);
          return;
        } catch {
          localStorage.removeItem('pendingReferral');
        }
      }

      setTimeout(() => {
        if (redirect) {
          router.push(decodeURIComponent(redirect));
        } else {
          router.push('/events');
        }
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 p-8">
      {step === 'signup' ? (
        <>
          <h2 className="text-2xl font-black text-black mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-6">Join the campus community hub.</p>

          {error && (
            <div className="mb-4 px-4 py-3 border border-gray-300 bg-gray-50 text-gray-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="College Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Department */}
            <div className="relative">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                title="Select your department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-300 text-black focus:outline-none focus:border-black transition-colors appearance-none"
              >
                <option value="" disabled>Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-black hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link
              href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
              className="text-black underline font-semibold"
            >
              Sign In
            </Link>
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black text-black mb-1">Verify Email</h2>
          <p className="text-gray-500 text-sm mb-6">Check your college email for the 6-digit OTP.</p>

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
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-center text-2xl font-mono tracking-widest"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-black hover:bg-gray-800 text-white font-bold transition-colors disabled:opacity-60"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
            </button>
          </form>
          <button
            onClick={() => setStep('signup')}
            className="mt-4 text-sm text-gray-500 hover:text-black transition-colors w-full text-center"
          >
            ← Back to Signup
          </button>
        </>
      )}
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
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
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getRegistrationCount, checkMyRegistration, registerForEvent } from '@/lib/api';

interface TeamConfig {
  isTeamEvent: boolean;
  minMembers: number;
  maxMembers: number;
}

interface Member {
  name: string;
  email: string;
  rollNumber: string;
  department: string;
}

interface CommunityLink {
  whatsapp?: string;
  telegram?: string;
  discord?: string;
}

interface Props {
  eventId: string;
  teamConfig?: TeamConfig;
  registrationDeadline?: string;
  communityLink?: CommunityLink;
}

export default function RegisterButton({ eventId, teamConfig, registrationDeadline, communityLink: communityLinkProp }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('ref'); // Capture referral code from URL

  const isTeam = teamConfig?.isTeamEvent ?? false;
  const maxMembers = teamConfig?.maxMembers ?? 1;
  const minMembers = teamConfig?.minMembers ?? 1;
  const initialExtraSlots = isTeam ? Math.max(0, minMembers - 1) : 0;

  // If a deadline was given and it's in the past → registration is closed
  const isClosed = registrationDeadline
    ? new Date(registrationDeadline) < new Date()
    : false;

  const [count, setCount] = useState<number>(0);
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [joinLinks, setJoinLinks] = useState<CommunityLink | undefined>(communityLinkProp);
  const [userEmail, setUserEmail] = useState('');

  const emptyMember = (): Member => ({ name: '', email: '', rollNumber: '', department: '' });

  const [leader, setLeader] = useState<Member>(emptyMember());
  const [members, setMembers] = useState<Member[]>(
    Array.from({ length: initialExtraSlots }, emptyMember)
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    const init = async () => {
      try {
        const countData = await getRegistrationCount(eventId);
        setCount(countData.count);
        if (token) {
          const check = await checkMyRegistration(eventId, token);
          setRegistered(check.registered);
        }
        // Pre-load user email from localStorage
        const stored = localStorage.getItem('user');
        if (stored) {
          try { setUserEmail(JSON.parse(stored).email || ''); } catch {}
        }
      } catch (e) { console.error(e); }
      finally { setInitializing(false); }
    };
    init();
  }, [eventId]);

  const setMember = (idx: number, field: keyof Member, value: string) => {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMember = () => {
    if (members.length < maxMembers - 1) setMembers((prev) => [...prev, emptyMember()]);
  };

  const removeMember = (idx: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      if (referralCode) {
        localStorage.setItem('pendingReferral', JSON.stringify({ eventId, ref: referralCode }));
      }
      router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`);
      return;
    }

    // Validate min members
    const totalTeam = 1 + members.length;
    if (isTeam && totalTeam < minMembers) {
      setError(`Minimum ${minMembers} team members required (including leader). Add ${minMembers - totalTeam} more.`);
      return;
    }
    if (!leader.name || !leader.rollNumber) {
      setError('Team leader name and roll number are required.');
      return;
    }
    const invalidMember = members.findIndex((m) => !m.name || !m.rollNumber);
    if (invalidMember >= 0) {
      setError(`Member ${invalidMember + 2} name and roll number are required.`);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      if (isTeam) {
        body.teamLeader = leader;
        body.teamMembers = members;
      }
      if (referralCode) {
        body.referredBy = referralCode;
      }
      const data = await registerForEvent(eventId, token, body);
      setCount(data.registrationCount);
      if (data.communityLink) setJoinLinks(data.communityLink);
      setRegistered(true);
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already registered')) setRegistered(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Simple register (no team form needed)
  const handleSimpleRegister = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (referralCode) {
        localStorage.setItem('pendingReferral', JSON.stringify({ eventId, ref: referralCode }));
      }
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?redirect=${redirectUrl}`);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const body: Record<string, unknown> = {};
      if (referralCode) {
        body.referredBy = referralCode;
      }
      const data = await registerForEvent(eventId, token, body);
      setCount(data.registrationCount);
      if (data.communityLink) setJoinLinks(data.communityLink);
      setRegistered(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg.includes('already registered')) setRegistered(true);
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black placeholder-gray-400 focus:outline-none focus:border-black';

  if (initializing) {
    return (
      <div className="border border-gray-200 rounded-lg p-5 animate-pulse">
        <div className="h-5 w-32 bg-gray-100 rounded mb-3" />
        <div className="h-10 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  // Registration is closed — don't show the button at all
  if (isClosed) {
    return (
      <div className="border border-gray-200 rounded-lg p-5">
        <p className="font-bold text-black text-sm mb-0.5">Registration Closed</p>
        <p className="text-gray-500 text-xs mb-3">{count} student{count !== 1 ? 's' : ''} registered</p>
        <div className="w-full py-2.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-md text-center select-none">
          Deadline has passed
        </div>
      </div>
    );
  }

  if (registered) {
    const links = joinLinks || communityLinkProp;
    const hasLinks = links && (links.whatsapp || links.telegram || links.discord);
    return (
      <div className="border border-black rounded-lg p-5 space-y-4">
        <div>
          <p className="font-bold text-black text-sm mb-1">✓ You&apos;re Registered!</p>
          <p className="text-gray-500 text-xs">{count} student{count !== 1 ? 's' : ''} registered</p>
          {userEmail && (
            <p className="text-gray-400 text-xs mt-1">Confirmation sent to <span className="font-medium text-black">{userEmail}</span></p>
          )}
        </div>
        {hasLinks && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-black uppercase tracking-widest">Join the Community</p>
            {links!.whatsapp && (
              <a
                href={links!.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: '#25D366' }}
              >
                <span>💬</span> Join WhatsApp Group
              </a>
            )}
            {links!.telegram && (
              <a
                href={links!.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: '#2CA5E0' }}
              >
                <span>✈️</span> Join Telegram Channel
              </a>
            )}
            {links!.discord && (
              <a
                href={links!.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: '#5865F2' }}
              >
                <span>🎮</span> Join Discord Server
              </a>
            )}
          </div>
        )}
        {!hasLinks && (
          <p className="text-xs text-gray-400">Community links will be shared by the organizer soon.</p>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <p className="font-bold text-black text-sm mb-0.5">Register for Event</p>
      <p className="text-gray-500 text-xs mb-4">{count} student{count !== 1 ? 's' : ''} registered</p>

      {error && <p className="text-gray-700 text-xs mb-3 border border-gray-300 bg-gray-50 rounded px-3 py-2">{error}</p>}

      {isTeam && !showForm ? (
        <button
          onClick={() => {
            const token = localStorage.getItem('token');
            if (!token) {
              const redirect = encodeURIComponent(window.location.pathname + window.location.search);
              router.push(`/login?redirect=${redirect}`);
              return;
            }
            setShowForm(true);
          }}
          className="w-full py-2.5 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 transition-colors"
        >
          Register as Team
        </button>
      ) : isTeam && showForm ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team size info */}
          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-3 py-2">
            Team size: {minMembers}–{maxMembers} members (including leader)
            &nbsp;·&nbsp; Current: {1 + members.length} member{1 + members.length !== 1 ? 's' : ''}
          </div>

          {/* Team size controller */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100 mb-2">
            <span className="text-[10px] font-bold text-black uppercase tracking-widest">Total Team Size</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => removeMember(members.length - 1)}
                disabled={1 + members.length <= minMembers}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-black hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
              >
                –
              </button>
              <span className="font-black text-sm w-4 text-center">{1 + members.length}</span>
              <button
                type="button"
                onClick={addMember}
                disabled={1 + members.length >= maxMembers}
                className="w-8 h-8 flex items-center justify-center border border-gray-200 text-black hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Team Leader */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Team Leader</p>
            <div className="space-y-2">
              <input className={inp} placeholder="Full Name *" value={leader.name} onChange={(e) => setLeader({ ...leader, name: e.target.value })} required />
              <input className={inp} placeholder="Email" type="email" value={leader.email} onChange={(e) => setLeader({ ...leader, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="Roll Number *" value={leader.rollNumber} onChange={(e) => setLeader({ ...leader, rollNumber: e.target.value })} required />
                <input className={inp} placeholder="Department" value={leader.department} onChange={(e) => setLeader({ ...leader, department: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Team Members */}
          {members.map((m, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-black">Member {idx + 2}</p>
                <button type="button" onClick={() => removeMember(idx)} className="text-xs text-gray-400 hover:text-black">Remove</button>
              </div>
              <div className="space-y-2">
                <input className={inp} placeholder="Full Name *" value={m.name} onChange={(e) => setMember(idx, 'name', e.target.value)} required />
                <input className={inp} placeholder="Email" type="email" value={m.email} onChange={(e) => setMember(idx, 'email', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inp} placeholder="Roll Number *" value={m.rollNumber} onChange={(e) => setMember(idx, 'rollNumber', e.target.value)} required />
                  <input className={inp} placeholder="Department" value={m.department} onChange={(e) => setMember(idx, 'department', e.target.value)} />
                </div>
              </div>
            </div>
          ))}

          {/* Add member button */}
          {members.length < maxMembers - 1 && (
            <button
              type="button"
              onClick={addMember}
              className="w-full py-2.5 border-2 border-dashed border-gray-200 text-sm font-bold text-gray-400 hover:border-black hover:text-black transition-all flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span> Add Team Member {members.length + 2}
            </button>
          )}

          {/* Prompt for removing if above min */}
          {members.length > minMembers - 1 && (
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
              You can remove members using the &quot;Remove&quot; link above each section
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setError(''); }} className="flex-1 py-2.5 border border-gray-300 text-sm text-gray-600 rounded-md hover:border-black transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {loading ? 'Registering...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={handleSimpleRegister}
          disabled={loading}
          className="w-full py-2.5 bg-black text-white text-sm font-bold rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Registering...' : 'Register Now'}
        </button>
      )}

      <p className="text-gray-400 text-xs text-center mt-3">
        {typeof window !== 'undefined' && !localStorage.getItem('token')
          ? (
            <Link
              href={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              className="text-black font-semibold hover:underline"
            >
              Sign in to register for this event
            </Link>
          )
          : 'Instant confirmation · No forms'}
      </p>
    </div>
  );
}

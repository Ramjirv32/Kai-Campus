'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/api';
import { ChevronLeft, ShieldAlert, UploadCloud, MapPin, CalendarDays, Users, Link2, Tag, Sparkles, RefreshCw, X } from 'lucide-react';

const CATEGORIES = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'paper_presentation', label: 'Paper Presentation' },
  { value: 'project_expo', label: 'Project Expo' },
  { value: 'quiz_competition', label: 'Quiz Competition' },
  { value: 'debate', label: 'Debate' },
  { value: 'coding_challenge', label: 'Coding Challenge' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'cultural_fest', label: 'Cultural Fest' },
  { value: 'sports_tournament', label: 'Sports Tournament' },
  { value: 'photography_contest', label: 'Photography Contest' },
  { value: 'business_plan_competition', label: 'Business Plan Competition' },
  { value: 'open_mic', label: 'Open Mic' },
];

const DEPARTMENTS = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'AIML', 'CSD', 'Other',
];

export default function CreateEventPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    venue: '',
    eventDate: '',
    registrationDeadline: '',
    registrationLink: '',
    totalSlots: '',
    tags: '',
    whatsapp: '',
    telegram: '',
    discord: '',
    isTeamEvent: 'false',
    minMembers: '1',
    maxMembers: '1',
  });
  const [poster, setPoster] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterMode, setPosterMode] = useState<'upload' | 'ai'>('ai');
  const [generatingPoster, setGeneratingPoster] = useState(false);
  const [posterError, setPosterError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    if (stored) {
      const u = JSON.parse(stored);
      if (u.role !== 'student') setAccessDenied(true);
    }
  }, [router]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handlePoster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPoster(file);
    setPosterPreview(URL.createObjectURL(file));
    setPosterError('');
  };

  const handleRemovePoster = () => {
    setPoster(null);
    setPosterPreview(null);
    setPosterError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleModeChange = (mode: 'upload' | 'ai') => {
    if (mode !== posterMode) {
      handleRemovePoster();
      setPosterMode(mode);
    }
  };

  const handleGeneratePoster = async () => {
    if (!form.title) {
      setPosterError('Please enter an event title first.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setPosterError('');
    setGeneratingPoster(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';
      const res = await fetch(`${API}/api/ai/generate-poster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          eventDate: form.eventDate,
          venue: form.venue,
          description: form.description,
        }),
        signal: AbortSignal.timeout(70000),
      });
      const data = await res.json();
      if (!data.success || !data.imageUrl) throw new Error(data.message || 'No image returned');

      // Fetch the image as a blob so it can be sent as a File in FormData
      const imgRes = await fetch(data.imageUrl);
      const blob = await imgRes.blob();
      const file = new File([blob], 'ai-poster.png', { type: blob.type || 'image/png' });
      setPoster(file);
      setPosterPreview(URL.createObjectURL(file));
    } catch (err: unknown) {
      setPosterError(err instanceof Error ? err.message : 'Poster generation failed.');
    } finally {
      setGeneratingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    if (!form.title || !form.category || !form.venue || !form.eventDate) {
      setError('Please fill in all required fields.');
      return;
    }
    const min = parseInt(form.minMembers) || 1;
    const max = parseInt(form.maxMembers) || 1;
    if (min > max) { setError('Min members cannot exceed max members.'); return; }

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (poster) fd.append('poster', poster);

      await createEvent(fd, token);
      router.push('/events?submitted=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-lg bg-white border border-gray-300 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors text-sm';
  const labelClass = 'block text-sm font-semibold text-black mb-1';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {accessDenied && (
        <div className="mb-8 flex items-center gap-3 bg-gray-50 border border-gray-300 text-gray-700 px-4 py-4">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Students Only</p>
            <p className="text-sm">Only students can create events. Admins manage events from the Admin Panel.</p>
          </div>
        </div>
      )}
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-black mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Events
      </button>

      <h1 className="text-2xl font-black text-black mb-1">Create an Event</h1>
      <p className="text-gray-500 text-sm mb-8">
        Fill in the details below. Your event will be reviewed before it goes live.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className={labelClass}>Event Title <span className="text-gray-500">*</span></label>
          <input
            className={inputClass}
            placeholder="e.g. National Level Hackathon 2026"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} resize-none`}
            rows={4}
            placeholder="Tell participants what this event is about..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        {/* Category + Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category <span className="text-gray-500">*</span></label>
            <select
              title="Event category"
              className={inputClass}
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              required
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <select
              title="Event department"
              className={inputClass}
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
            >
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className={labelClass}>
            <MapPin className="inline w-3.5 h-3.5 mr-1" />
            Venue <span className="text-gray-500">*</span>
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Main Auditorium, Block A"
            value={form.venue}
            onChange={(e) => set('venue', e.target.value)}
            required
          />
        </div>

        {/* Event Date + Registration Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <CalendarDays className="inline w-3.5 h-3.5 mr-1" />
              Event Date <span className="text-gray-500">*</span>
            </label>
            <input
              type="datetime-local"
              title="Event date and time"
              className={inputClass}
              value={form.eventDate}
              onChange={(e) => set('eventDate', e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Registration Deadline</label>
            <input
              type="datetime-local"
              title="Registration deadline"
              className={inputClass}
              value={form.registrationDeadline}
              onChange={(e) => set('registrationDeadline', e.target.value)}
            />
          </div>
        </div>

        {/* Total Slots + Registration Link */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <Users className="inline w-3.5 h-3.5 mr-1" />
              Total Slots
            </label>
            <input
              type="number"
              min={1}
              className={inputClass}
              placeholder="e.g. 100"
              value={form.totalSlots}
              onChange={(e) => set('totalSlots', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>
              <Link2 className="inline w-3.5 h-3.5 mr-1" />
              External Registration Link
            </label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://forms.google.com/..."
              value={form.registrationLink}
              onChange={(e) => set('registrationLink', e.target.value)}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className={labelClass}>
            <Tag className="inline w-3.5 h-3.5 mr-1" />
            Tags
          </label>
          <input
            className={inputClass}
            placeholder="e.g. AI, Web, Design  (comma separated)"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
          />
        </div>

        {/* Community Links */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-black mb-0.5">Community &amp; Joining Links</p>
            <p className="text-xs text-gray-500 mb-3">Add links so registered participants can join your community groups.</p>
          </div>
          <div>
            <label className={labelClass}>💬 WhatsApp Group Link</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://chat.whatsapp.com/..."
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>✈️ Telegram Channel / Group Link</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://t.me/..."
              value={form.telegram}
              onChange={(e) => set('telegram', e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>🎮 Discord Server Link</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://discord.gg/..."
              value={form.discord}
              onChange={(e) => set('discord', e.target.value)}
            />
          </div>
        </div>

        {/* Team Config */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-black">Team Event?</p>
              <p className="text-xs text-gray-500">Enable if participants register as teams</p>
            </div>
            <button
              type="button"
              title={form.isTeamEvent === 'true' ? 'Disable team event' : 'Enable team event'}
              aria-label={form.isTeamEvent === 'true' ? 'Disable team event' : 'Enable team event'}
              onClick={() => set('isTeamEvent', form.isTeamEvent === 'true' ? 'false' : 'true')}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.isTeamEvent === 'true' ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                form.isTeamEvent === 'true' ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>

          {form.isTeamEvent === 'true' && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <label className={labelClass}>Min Team Members</label>
                <input
                  type="number" min={1} max={parseInt(form.maxMembers) || 20}
                  title="Minimum team members"
                  className={inputClass}
                  value={form.minMembers}
                  onChange={(e) => set('minMembers', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Minimum required per team</p>
              </div>
              <div>
                <label className={labelClass}>Max Team Members</label>
                <input
                  type="number" min={parseInt(form.minMembers) || 1} max={20}
                  title="Maximum team members"
                  className={inputClass}
                  value={form.maxMembers}
                  onChange={(e) => set('maxMembers', e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Maximum allowed per team</p>
              </div>
            </div>
          )}
        </div>

        {/* Poster */}
        <div>
          <label className={labelClass}>Event Poster <span className="text-gray-400 font-normal text-xs">(optional)</span></label>

          {/* Mode tabs — hidden once poster chosen */}
          {!posterPreview && !generatingPoster && (
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => handleModeChange('ai')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  posterMode === 'ai'
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-black hover:text-black'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate with EURI AI
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('upload')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  posterMode === 'upload'
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-300 text-gray-500 hover:border-black hover:text-black'
                }`}
              >
                <UploadCloud className="w-4 h-4" />
                Upload Poster
              </button>
            </div>
          )}

          {/* UPLOAD mode */}
          {posterMode === 'upload' && !posterPreview && !generatingPoster && (
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer flex flex-col items-center justify-center gap-2 h-40 border-2 border-dashed border-gray-300 bg-gray-50 hover:border-black transition-colors rounded-lg"
            >
              <UploadCloud className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-400">Click to upload poster image</p>
              <p className="text-xs text-gray-300">PNG, JPG, WEBP up to 5MB</p>
            </div>
          )}

          {/* AI GENERATE mode */}
          {posterMode === 'ai' && !posterPreview && !generatingPoster && (
            <div className="flex flex-col items-center gap-3 py-6 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
              <Sparkles className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Generate poster using EURI AI</p>
                <p className="text-xs text-gray-400 mt-0.5">Uses your event title, date, venue &amp; description. Takes ~30s.</p>
              </div>
              <button
                type="button"
                onClick={handleGeneratePoster}
                disabled={generatingPoster}
                className="flex items-center gap-2 px-5 py-2 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Generate Poster
              </button>
            </div>
          )}

          {/* Generating spinner */}
          {generatingPoster && (
            <div className="flex flex-col items-center justify-center gap-3 h-48 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Generating poster with EURI AI…</p>
              <p className="text-xs text-gray-400">This usually takes 20–40 seconds</p>
            </div>
          )}

          {/* Preview */}
          {posterPreview && !generatingPoster && (
            <div className="relative group/poster">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={posterPreview} alt="Poster preview" className="w-full max-h-80 object-contain rounded-lg border border-gray-200" />
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/poster:opacity-100 transition-opacity">
                {posterMode === 'ai' && (
                  <button
                    type="button"
                    onClick={handleGeneratePoster}
                    disabled={generatingPoster}
                    className="flex items-center gap-1.5 bg-white/90 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                )}
                {posterMode === 'upload' && (
                  <label className="flex items-center gap-1.5 bg-white/90 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-colors cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" /> Replace
                    <input type="file" accept="image/*" className="hidden" onChange={handlePoster} />
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleRemovePoster}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" title="Upload event poster" aria-label="Upload event poster" className="hidden" onChange={handlePoster} />

          {posterError && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <span>⚠</span> {posterError}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-300 px-4 py-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || accessDenied}
          className="w-full py-3 rounded-lg bg-black hover:bg-gray-800 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Event for Approval'}
        </button>

        <p className="text-xs text-center text-gray-400">
          Your event will be reviewed by an admin before it appears on the events page.
        </p>
      </form>
    </div>
  );
}

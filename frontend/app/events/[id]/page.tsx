import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, ArrowLeft, Tag } from 'lucide-react';
import { getEventById } from '@/lib/api';
import OneTapJoin from '@/components/OneTapJoin';
import ReferralBanner from '@/components/ReferralBanner';
import RegisterButton from '@/components/RegisterButton';

export const revalidate = 60;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let event;
  try {
    event = await getEventById(id);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Back */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-black text-sm mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero image */}
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden">
            <Image src={event.posterUrl || event.imageUrl || '/placeholder-event.jpg'} alt={event.title} fill className="object-cover" />
            {event.featured && (
              <span className="absolute top-4 left-4 bg-black text-white text-xs font-bold px-3 py-1">
                Featured
              </span>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full border border-black/20 text-black capitalize"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {event.category?.replace(/_/g, ' ')}
              </span>
              {(event.registrationDeadline
                ? new Date(event.registrationDeadline) < new Date()
                : new Date(event.eventDate) < new Date()) && (
                  <span className="border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1">
                    Closed
                  </span>
                )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-black mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-500 text-sm mb-6">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {event.eventDate ? new Date(event.eventDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : `${event.startDate} ${event.startTime}`}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {event.venue || event.location}
              </span>
            </div>
            <p className="text-gray-600 leading-relaxed text-base">{event.description}</p>
          </div>

          {/* Referral mechanic - only show if event has referral code */}
          {event.referralCode && (
            <ReferralBanner eventId={event._id} referralCode={event.referralCode} />
          )}
        </div>

        {/* Right: sidebar */}
        <div className="space-y-6">
          {/* Register CTA */}
          <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-lg" />}>
            <RegisterButton eventId={event._id} teamConfig={event.teamConfig} registrationDeadline={event.registrationDeadline} communityLink={event.communityLink} />
          </Suspense>

          {/* One-tap community join */}
          <OneTapJoin label="Join Event Community" />

          {/* Quick info */}
          <div className="bg-white border border-black/5 rounded-2xl p-5 space-y-3 text-sm shadow-sm">
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Date & Time</span>
              <span className="text-black font-semibold">
                {event.eventDate ? new Date(event.eventDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : `${event.startDate} ${event.startTime}`}
              </span>
            </div>
            <div className="flex justify-between border-b border-black/5 pb-2">
              <span className="text-gray-500">Venue</span>
              <span className="text-black font-semibold text-right max-w-[60%]">{event.venue || event.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="text-black font-semibold capitalize">{event.category?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface Event {
  startTime?: string;
  endTime?: string;
  _id: string;
  title: string;
  description: string;
  category: 'hackathon' | 'paper_presentation' | 'project_expo' | 'quiz_competition' | 'debate' | 'coding_challenge' | 'workshop' | 'cultural_fest' | 'sports_tournament' | 'photography_contest' | 'business_plan_competition' | 'open_mic';
  department?: string;
  venue: string;
  eventDate: string;
  registrationDeadline?: string;
  registrationLink?: string;
  posterUrl?: string;
  imageUrl?: string;
  totalSlots?: number;
  filledSlots?: number;
  registrationCount?: number;
  status?: 'pending' | 'approved' | 'rejected';
  referralCode?: string;
  teamConfig?: { isTeamEvent: boolean; minMembers: number; maxMembers: number };
  communityLink?: { whatsapp?: string; telegram?: string; discord?: string };
  createdBy?: { _id: string; name: string; email: string; department: string } | string;
  createdAt: string;
  // legacy compat
  location?: string;
  startDate?: string;
  endDate?: string;
  joinLink?: string;
  featured?: boolean;
  isRegistrationOpen?: boolean;
  registrations?: number;
}

export type EventCategory = 'all' | 'hackathon' | 'paper_presentation' | 'project_expo' | 'quiz_competition' | 'debate' | 'coding_challenge' | 'workshop' | 'cultural_fest' | 'sports_tournament' | 'photography_contest' | 'business_plan_competition' | 'open_mic';

export interface Registration {
  _id: string;
  event: { _id: string; title: string; category: string; eventDate: string } | string;
  student: { _id: string; name: string; email: string; department: string } | string;
  teamMembers?: { name: string; email: string; rollNumber: string }[];
  teamSize?: number;
  referrer?: { _id: string; name: string; email: string } | string;
  registeredAt: string;
  // legacy compat
  user?: { _id: string; name: string; email: string; department: string } | string;
  name?: string;
  email?: string;
  department?: string;
  createdAt?: string;
}

export interface Faculty {
  name: string;
  dept: string;
  role: string;
  imageBase64?: string;
}

export interface ClubMember {
  name: string;
  class: string;
  position?: string;
  imageBase64?: string;
  linkedin?: string;
}

export interface ClubHead {
  name: string;
  class: string;
  position: string;
  email: string;
  imageBase64?: string;
  linkedin?: string;
}

export interface Club {
  _id: string;
  id: string;
  name: string;
  description: string;
  logoBase64?: string;
  content?: string;
  members: number;
  faculty: Faculty[];
  head: ClubHead;
  memberList: ClubMember[];
  whatsapp?: string;
  telegram?: string;
  discord?: string;
  instagram?: string;
}

export interface AssociationMember {
  _id: string;
  name: string;
  position: string;
  department: string;
  imageBase64?: string;
  linkedin?: string;
}

export interface ExecutiveMember {
  _id: string;
  name: string;
  position: string;
  department: string;
  imageBase64?: string;
  linkedin?: string;
}

export interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  totalRegistrations: number;
  pendingApprovals: number;
  totalClubs: number;
  totalMembers: number;
  categoryBreakdown: { _id: string; count: number }[];
  registrationTrend: { _id: string; count: number }[];
  recentEvents: Event[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'campus_captain' | 'admin';
  department?: string;
  referralCount?: number;
  isVerified: boolean;
  createdAt: string;
}

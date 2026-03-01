import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'paper_presentation', 'project_expo', 'hackathon', 'quiz_competition',
      'debate', 'coding_challenge', 'workshop', 'cultural_fest',
      'sports_tournament', 'photography_contest', 'business_plan_competition', 'open_mic'
    ],
    required: true
  },
  department: {
    type: String,
  },
  venue: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
  },
  registrationLink: {
    type: String, // External link (optional)
  },
  posterUrl: {
    type: String, // Cloudinary URL
  },
  teamConfig: {
    isTeamEvent: { type: Boolean, default: false },
    minMembers: { type: Number, default: 1 },
    maxMembers: { type: Number, default: 1 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  referralCode: {
    type: String,
    unique: true
  },
  referralCount: {
    type: Number,
    default: 0
  },
  registrationCount: {
    type: Number,
    default: 0
  },
  tags: [String],
  totalSlots: {
    type: Number,
    required: true
  },
  filledSlots: {
    type: Number,
    default: 0
  },
  communityLink: {
    whatsapp: String,
    telegram: String,
    discord: String
  }
}, {
  timestamps: true
});

const Event = mongoose.model('Event', eventSchema);
export default Event;
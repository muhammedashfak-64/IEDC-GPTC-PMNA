export type UserRole = 'student' | 'member' | 'executive' | 'faculty' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  staffId?: string;
  role: UserRole | string;
  department: string;
  semester: string;
  registerNumber: string;
  avatar: string;
  points: number;
  innovationScore: number;
  rank: number;
  badges: string[];
  joinedDate?: string;
}

export type UserPersona = UserProfile;

export interface Project {
  id: string;
  title: string;
  description: string;
  department: string;
  technology: string[];
  year: string;
  status: 'In Progress' | 'Prototype' | 'Completed' | 'Incubated';
  author: string;
  mentor?: string;
  likes: number;
  bookmarks: number;
  githubUrl?: string;
  demoUrl?: string;
  imageUrl: string;
  documents?: { name: string; url: string }[];
  teamMembers: string[];
  commentsCount: number;
}

export interface Startup {
  id: string;
  name: string;
  tagline: string;
  description: string;
  founders: string[];
  founder?: string;
  department: string;
  stage: 'Idea' | 'Prototype' | 'Registered' | 'Funded' | 'Scaling' | string;
  fundingAmount?: string;
  logo: string;
  website?: string;
  pitchDeckUrl?: string;
  incubationStage?: string;
  grantReceived?: string;
  logoUrl?: string;
}

export interface InnovationIdea {
  id: string;
  title: string;
  studentName: string;
  registerNumber: string;
  department: string;
  problemStatement: string;
  proposedSolution: string;
  technologyStack?: string[];
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Mentorship' | 'Rejected' | 'Pending';
  mentorAssigned?: string;
  assignedMentor?: string;
  createdAt: string;
  fileAttachment?: string;
}

export type IdeaItem = InnovationIdea;

export interface EventItem {
  id: string;
  title: string;
  category: 'Hackathon' | 'Workshop' | 'Seminar' | 'Bootcamp' | 'Competition' | 'State Program';
  level: 'College' | 'State' | 'National';
  date: string;
  time: string;
  venue: string;
  description: string;
  speaker?: string;
  totalSeats: number;
  seatsAvailable: number;
  bannerImage: string;
  registrationOpen: boolean;
  certificateEligible: boolean;
}

export interface CertificateItem {
  id: string;
  certificateId: string;
  participantName: string;
  registerNumber: string;
  email: string;
  eventName: string;
  eventDate: string;
  certificateType: 'Participation' | 'Winner' | 'Organizer' | 'Speaker' | 'Judge';
  issueDate: string;
  qrCodeUrl: string;
  status: 'Verified' | 'Pending' | 'Revoked' | 'Published';
}

export interface LearningResource {
  id: string;
  title: string;
  category: 'Arduino' | 'ESP32' | 'IoT' | 'Python' | 'AI & ML' | 'Web Dev' | 'Robotics';
  type: 'PDF Notes' | 'Video Tutorial' | 'Code Repository' | 'Assignment';
  description: string;
  downloadUrl: string;
  author: string;
  views: number;
}

export interface ResourceTemplate {
  id: string;
  title: string;
  type: 'PPT Template' | 'IEEE Format' | 'Project Report' | 'Branding Kit' | 'Form';
  fileSize: string;
  downloadUrl: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  imageUrl: string;
  commentsCount: number;
}

export interface ForumThread {
  id: string;
  title: string;
  author: string;
  department: string;
  category: string;
  content: string;
  repliesCount: number;
  createdAt: string;
  likes: number;
}

export interface EquipmentBooking {
  id: string;
  equipmentName: string;
  studentName: string;
  registerNumber: string;
  bookingDate: string;
  durationHours: number;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  purpose: string;
}

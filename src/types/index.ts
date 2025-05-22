// ユーザー関連
export type UserRole = 'student' | 'company' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  profilePhotoUrl?: string;
  bio?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends User {
  university?: string;
  faculty?: string;
  major?: string;
  graduationYear?: number;
  skills: string[];
  interests: string[];
  portfolioLinks?: Record<string, string>;
}

export interface Company {
  id: number;
  userId: number;
  companyName: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  industry?: string;
  address?: string;
}

// プログラム関連
export type ProgramStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'archived';

export interface Program {
  id: number;
  companyId: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  requirements?: string;
  benefits?: string;
  targetAudience?: string;
  category?: string;
  applicationStartDate?: string;
  applicationEndDate?: string;
  programStartDate?: string;
  programEndDate?: string;
  maxParticipants?: number;
  status: ProgramStatus;
  company?: Company;
}

// 応募関連
export type ApplicationStatus = 
  | 'pending' 
  | 'under_review' 
  | 'shortlisted' 
  | 'interview_scheduled' 
  | 'rejected_by_company' 
  | 'accepted' 
  | 'declined_by_student' 
  | 'withdrawn_by_student';

export interface Application {
  id: number;
  programId: number;
  studentUserId: number;
  status: ApplicationStatus;
  applicationMessage?: string;
  appliedAt: string;
  companyFeedback?: string;
  program?: Program;
  student?: Student;
}

// バッジ関連
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface BadgeRequest {
  id: number;
  programId: number;
  studentUserId: number;
  requestedByCompanyId: number;
  status: RequestStatus;
  comments?: string;
  badgeNameSuggestion?: string;
  requestedAt: string;
  rejectionReason?: string;
}

export interface Badge {
  id: number;
  studentUserId: number;
  programId: number;
  badgeRequestId: number;
  badgeName: string;
  badgeDescription?: string;
  badgeImageUrl: string;
  issuedAt: string;
  program?: Program;
}

// API関連
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

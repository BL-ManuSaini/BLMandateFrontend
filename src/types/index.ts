// ─── Enums / Union types ─────────────────────────────────────────────────────

export type UserRole =
  | 'MIS_MANAGER'
  | 'ACCOUNT_MANAGER'
  | 'COE_LAB_HEAD'
  | 'HEAD_OF_ENGINEERING'
  | 'COE_COORDINATOR';

export type MandateStatus = 'draft' | 'active' | 'on_hold' | 'closed' | 'cancelled';
export type RequirementStatus = 'draft' | 'active' | 'on_hold' | 'fulfilled' | 'cancelled';

export const CandidateStatus = {
  SELECTED: 'Selected',
  PROPOSED: 'Proposed',
  MAPPED: 'Mapped',
  DISCUSSED: 'Discussed',
  LOI_SENT: 'LOI Sent',
  LOI_SIGNED: 'LOI Signed',
  CFP_STARTED: 'CFP Started',
  DROPPED: 'Dropped',
} as const;

export type CandidateStatus = typeof CandidateStatus[keyof typeof CandidateStatus];

export type MappingStatus =
  | 'Draft'
  | 'Submitted'
  | 'Engineering Review'
  | 'Approved by Eng'
  | 'Confirmed by MIS'
  | 'In Discussion'
  | 'LOI Issued'
  | 'Signed'
  | 'CFP Started';

export type DiscussionOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Need Time'
  | 'Unreachable';

export type LOIStatus = 'Sent' | 'LOI Sent' | 'Signed' | 'LOI Signed' | 'Acknowledged' | 'Pending' | 'Cancelled' | 'Declined' | 'Rejected';

export type ApprovalDecision = 'Approved' | 'Rejected' | 'Pending' | 'Revision Requested';

export type DriveStatus = 'planned'  | 'completed' | 'cancelled';

export type NotificationType =
  | 'MAPPING_SUBMITTED'
  | 'ENGINEERING_APPROVED'
  | 'ENGINEERING_REJECTED'
  | 'MAPPING_CONFIRMED'
  | 'LOI_SIGNED'
  | 'DISCUSSION_DUE'
  | 'CFP_STARTED';

// ─── Core entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  coeScopeIds: string[];
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface COE {
  id: string;
  name: string;
  location: string;
  spoc: string;
  studentsCount: number;
}

export interface Client {
  id: string;
  name: string;
  tags: string[];
  accountOwner: string;
  shortCode: string;
}

export interface MandateRequirementSummary {
  id?: string;
  requirementId?: string;
  /** Display label for form/UI */
  techStack: string;
  /** Display label for form/UI */
  location: string;
  techStackId?: string;
  locationId?: string;
  status?: string;
  openPositions?: number;
  filledPositions?: number;
  intakeType?: string;
  techStackRef?: { id: string; label: string };
  locationRef?: { id: string; label: string; city?: string; state?: string };
}

export interface Mandate {
  id: string;
  clientId: string;
  mandateName: string;
  clientName?: string;
  shortName?: string;
  mandateType: string;
  contractRef: string;
  startDate: string;
  onboardingDate: string;
  /** Unique location labels for table display (from API locationSummary) */
  locations: string[];
  techStacks: string[];
  notes: string;
  status: MandateStatus;
  createdAt: string;
  createdBy: string;
  requirementsCount?: number;
  updatedAt?: string;
  requirements?: MandateRequirementSummary[];
}

export interface Requirement {
  id: string;
  mandateId: string;
  rid?: string;
  clientName?: string;
  requirementId: string;
  techStack: string;
  intakeType: string;
  expLevel: string;
  location: string;
  onboardingDate: string;
  openPositions: number;
  filledPositions: number;
  status: RequirementStatus;
  targetCoeIds: string[];
  notes?: string;
  description?: string;
  createdAt: string;
  mappingsCount?: number;
  updatedAt?: string;
}

export interface HiringDrive {
  id: string;
  coeId: string;
  driveName: string;
  date: string;
  venue: string;
  techCovered: string[];
  coordinatorId: string;
  notes: string;
  status: DriveStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Candidate {
  id: string;
  /** COE UUID from Mandate Service (same as HiringDrive). */
  coeId: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills: string[];
  resumeLink: string;
  cgpa: number;
  status: CandidateStatus;
  externalKey: string;
  availabilityDate?: string;
  createdAt: string;
  updatedAt?: string;
  rollNumber?: string;
  coeName?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface CandidateSelection {
  id: string;
  hiringDriveId: string;
  candidateId: string;
  selectionStatus: string;
  scores: Record<string, number>;
}

export interface MappingRequirementSummary {
  id: string;
  requirementId: string;
  techStack?: string | { id?: string; label?: string };
  clientName: string;
  mandateId?: string;
  location?: string;
}

export interface Mapping {
  id: string;
  requirementRecordId?: string;
  requirementRecordIds?: string[];
  requirement?: MappingRequirementSummary;
  requirements?: MappingRequirementSummary[];
  status: MappingStatus;
  createdBy: string;
  currentOwnerRole: UserRole;
  notes: string;
  lineItemsCount?: number;
  approvalsCount?: number;
  lineItems?: MappingLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface MappingLineItem {
  id: string;
  mappingId: string;
  candidateId: string;
  proposedTech: string;
  allocationType: 'Primary' | 'Secondary' | 'Backup';
  createdAt?: string;
}

export interface Approval {
  id: string;
  mappingId: string;
  actorRole: UserRole;
  actorId: string;
  decision: ApprovalDecision;
  comment: string;
  timestamp: string;
}

export interface DiscussionLog {
  id: string;
  mappingLineItemId: string;
  coordinatorId: string;
  outcome: DiscussionOutcome;
  notes: string;
  followUpDate: string | null;
  createdAt: string;
}

export interface LOI {
  id: string;
  candidateId: string;
  requirementRecordId: string;
  mappingId: string;
  sentAt: string;
  signedAt: string | null;
  documentUrl: string;
  status: LOIStatus;
  candidate?: any;
  candidateName?: string;
  candidateEmail?: string;
}

export interface CFPEnrollment {
  id: string;
  candidateId: string;
  coeId: string;
  requirementRecordId: string;
  startedAt: string;
  status: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
  linkTo: string;
}

export interface AuditEvent {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  timestamp: string;
}

// ─── API / UI helpers ─────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  permissions: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

import type { UserRole } from '../types';

// ─── Role display names ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  MIS_MANAGER: 'MIS Manager',
  ACCOUNT_MANAGER: 'Account Manager',
  COE_LAB_HEAD: 'COE Lab Head',
  HEAD_OF_ENGINEERING: 'Head Of Engineering',
  COE_COORDINATOR: 'COE Coordinator',
};

// ─── Route permissions ────────────────────────────────────────────────────────
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'HEAD_OF_ENGINEERING', 'COE_COORDINATOR'],
  '/mandates': ['MIS_MANAGER', 'ACCOUNT_MANAGER'],
  '/mandates/new': ['MIS_MANAGER', 'ACCOUNT_MANAGER'],
  '/requirements': ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD'],
  '/drives': ['MIS_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'],
  '/candidates': ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'],
  '/mappings': ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'HEAD_OF_ENGINEERING', 'COE_COORDINATOR'],
  '/approvals/engineering': ['MIS_MANAGER', 'HEAD_OF_ENGINEERING'],
  '/approvals/mis': ['MIS_MANAGER'],
  '/discussions': [ 'COE_LAB_HEAD', 'COE_COORDINATOR'],
  '/loi': ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'],
  '/admin/users': ['MIS_MANAGER'],
  '/admin/coes': ['MIS_MANAGER'],
};

// ─── Action permissions matching Swagger API Specification ────────────────────
export const can = {
  // Mandates
  createMandate: (role: UserRole) =>
    ['ACCOUNT_MANAGER'].includes(role),
  updateMandate: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  deleteMandate: (role: UserRole) =>
    role === 'MIS_MANAGER',

  // Requirements
  createRequirement: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role), // 
  updateRequirement: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  deleteRequirement: (role: UserRole) =>
    role === 'MIS_MANAGER',

  // Mappings & Line Items
  createMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),
  updateMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD'].includes(role),
  deleteMapping: (role: UserRole) =>
    role === 'MIS_MANAGER',
  addLineItem: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
  removeLineItem: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD'].includes(role),
  submitMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD'].includes(role),

  // Approvals
  engineeringApprove: (role: UserRole) =>
    role === 'HEAD_OF_ENGINEERING',
  misConfirm: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_COORDINATOR'].includes(role),

  // LOIs
  issueLOI: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  updateLOI: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  signLOI: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  deleteLOI: (role: UserRole) =>
    role === 'MIS_MANAGER',

  // Discussion Logs
  createDiscussion: (role: UserRole) =>
    ['COE_COORDINATOR', 'COE_LAB_HEAD'].includes(role),
  updateDiscussion: (role: UserRole) =>
    ['COE_COORDINATOR', 'COE_LAB_HEAD', 'MIS_MANAGER'].includes(role),
  deleteDiscussion: (role: UserRole) =>
    role === 'MIS_MANAGER',

  // Hiring Drives
  createHiringDrive: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),
  updateHiringDrive: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD',].includes(role),
  deleteHiringDrive: (role: UserRole) =>
    role === 'MIS_MANAGER',
  // View Permissions matching Route Permissions 100%
  viewMandate: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),
  viewRequirement: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD'].includes(role),
  viewMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'HEAD_OF_ENGINEERING', 'COE_COORDINATOR'].includes(role),
  viewLOI: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
  viewDiscussion: (role: UserRole) =>
    ['COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
  viewHiringDrive: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
  viewCandidate: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),

  // Candidates Actions
  importCandidates: (role: UserRole) =>
    ['COE_LAB_HEAD'].includes(role),
  deleteCandidate: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),
  createCandidates: (role: UserRole) =>
    ['COE_LAB_HEAD'].includes(role),
  updateCandidates: (role: UserRole) =>
    ['COE_LAB_HEAD'].includes(role),

  // Admin
  adminUsers: (role: UserRole) =>
    role === 'MIS_MANAGER',

  // Scope
  isCOEScoped: (role: UserRole) =>
    ['COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
};

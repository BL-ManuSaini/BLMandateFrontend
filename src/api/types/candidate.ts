/** Backend candidate status values (Swagger — no `Discussed`). */
export type CandidateApiStatus =
  | 'Selected'
  | 'Proposed'
  | 'Mapped'
  | 'Discussed'
  | 'CFP Started'
  | 'LOI Sent'
  | 'LOI Signed'
  | 'Dropped';

export interface CandidateApiDto {
  id?: string;
  /** Some HDS responses use `_id` or `candidateId` instead of `id`. */
  _id?: string;
  candidateId?: string;
  /** COE UUID (same as Mandate Service / HiringDrive); Swagger may list integer. */
  coeId: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills?: string[];
  resumeLink?: string;
  cgpa?: number;
  status: CandidateApiStatus;
  externalKey?: string;
  availabilityDate?: string;
  createdAt?: string;
  updatedAt?: string;
  rollNumber?: string;
  coeName?: string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface CreateCandidateApiDto {
  coeId: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills?: string[];
  resumeLink?: string;
  cgpa?: number;
  status?: CandidateApiStatus;
  availabilityDate?: string;
  rollNumber?: string;
  coeName?: string;
}

export interface UpdateCandidateApiDto {
  name?: string;
  email?: string;
  phone?: string;
  coeId?: string;
  graduationYear?: number;
  stream?: string;
  skills?: string[];
  cgpa?: number;
  status?: CandidateApiStatus;
  availabilityDate?: string;
  rollNumber?: string;
  coeName?: string;
}

export interface CandidateListParams {
  /** Swagger query param type: string */
  coeId?: string;
  status?: CandidateApiStatus;
  search?: string;
}

export interface ImportCandidateApiDto {
  coeName: string;
  rollNumber: string;
  name: string;
  email: string;
  phone: string;
  graduationYear: number;
  stream: string;
  skills?: string[];
  resumeLink?: string;
  cgpa?: number;
  status?: CandidateApiStatus;
  availabilityDate?: string;
}

export interface ImportCandidatesApiDto {
  candidates: ImportCandidateApiDto[];
}

export interface ImportCandidatesResultDto {
  success: number;
  failed: number;
  errors: string[];
}

import type { LOIStatus } from '../../types';

export type LoiApiStatus = LOIStatus;

export interface LoiApiDto {
  id: string;
  candidateId: string;
  requirementRecordId?: string;
  requirementId?: string;
  mappingId?: string;
  sentAt?: string;
  signedAt?: string | null;
  documentUrl?: string;
  status: LoiApiStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLoiApiDto {
  candidateId: string;
  requirementRecordId?: string;
  mappingId?: string;
  sentAt?: string;
  documentUrl?: string;
  status?: LoiApiStatus;
}

export interface UpdateLoiApiDto {
  sentAt?: string;
  signedAt?: string;
  documentUrl?: string;
  status?: LoiApiStatus;
}

export interface SignLoiApiDto {
  signedAt?: string;
}

export interface LoiListParams {
  candidateId?: string;
  requirementRecordId?: string;
  mappingId?: string;
  status?: LoiApiStatus;
}

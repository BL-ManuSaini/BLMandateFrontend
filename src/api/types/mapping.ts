import type { ApprovalDecision, MappingStatus, UserRole } from '../../types';

export type MappingApiStatus = MappingStatus;

export type MappingLineItemAllocationType = 'Primary' | 'Secondary' | 'Backup';

export type ApprovalApiDecision = ApprovalDecision | 'Revision Requested';

export interface MappingRequirementSummaryApiDto {
  id: string;
  requirementId: string;
  techStack?: string | { id?: string; label?: string };
  clientName: string;
  mandateId?: string;
  location?: string;
}

export interface MappingLineItemApiDto {
  id: string;
  candidateId: string;
  proposedTech?: string;
  allocationType: MappingLineItemAllocationType;
  createdAt?: string;
}

export interface MappingApiDto {
  id: string;
  requirementRecordId?: string;
  requirementRecordIds?: string[];
  requirementId?: string;
  requirement?: MappingRequirementSummaryApiDto;
  requirements?: MappingRequirementSummaryApiDto[];
  status: MappingApiStatus;
  createdBy?: string | null;
  currentOwnerRole?: string | null;
  notes?: string | null;
  lineItemsCount?: number;
  approvalsCount?: number;
  lineItems?: MappingLineItemApiDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMappingApiDto {
  requirementRecordIds: string[];
  requirementRecordId?: string;
  status?: MappingApiStatus;
  createdBy?: string;
  currentOwnerRole?: string;
  notes?: string;
}

export interface UpdateMappingApiDto {
  status?: MappingApiStatus;
  currentOwnerRole?: string;
  notes?: string;
}

export interface CreateMappingLineItemApiDto {
  candidateId: string;
  proposedTech?: string;
  allocationType?: MappingLineItemAllocationType;
}

export interface MappingListParams {
  search?: string;
  status?: MappingApiStatus;
  requirementRecordId?: string;
}

export interface ApprovalApiDto {
  id: string;
  mappingId: string;
  actorRole: string;
  actorId?: string;
  decision: ApprovalApiDecision;
  comment?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface CreateApprovalApiDto {
  mappingId: string;
  actorRole: string;
  actorId?: string;
  decision: ApprovalApiDecision;
  comment?: string;
}

export interface ApprovalListParams {
  mappingId?: string;
  decision?: ApprovalApiDecision;
  actorRole?: string;
}

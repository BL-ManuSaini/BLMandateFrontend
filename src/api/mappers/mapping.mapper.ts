import type {
  Approval,
  Mapping,
  MappingLineItem,
  MappingRequirementSummary,
  UserRole,
} from '../../types';
import type {
  ApprovalApiDto,
  CreateApprovalApiDto,
  CreateMappingApiDto,
  CreateMappingLineItemApiDto,
  MappingApiDto,
  MappingLineItemApiDto,
  UpdateMappingApiDto,
  MappingRequirementSummaryApiDto,
} from '../types/mapping';

function normalizeRole(role: string | null | undefined): UserRole {
  const valid: UserRole[] = [
    'MIS_MANAGER',
    'ACCOUNT_MANAGER',
    'COE_LAB_HEAD',
    'HEAD_OF_ENGINEERING',
    'COE_COORDINATOR',
  ];
  if (role && valid.includes(role as UserRole)) {
    return role as UserRole;
  }
  return 'COE_LAB_HEAD';
}

export function mapRequirementSummaryFromApi(
  dto: MappingRequirementSummaryApiDto | undefined
): MappingRequirementSummary | undefined {
  if (!dto) return undefined;
  return {
    id: dto.id,
    requirementId: dto.requirementId,
    techStack: typeof dto.techStack === 'object' ? dto.techStack?.label : dto.techStack,
    clientName: dto.clientName,
    mandateId: dto.mandateId,
    location: dto.location,
  };
}

export function mapLineItemFromApi(
  dto: MappingLineItemApiDto,
  mappingId: string
): MappingLineItem {
  return {
    id: dto.id,
    mappingId,
    candidateId: dto.candidateId,
    proposedTech: dto.proposedTech ?? '',
    allocationType: dto.allocationType,
    createdAt: dto.createdAt,
  };
}

export function mapMappingFromApi(dto: MappingApiDto): Mapping {
  const reqSummaries = dto.requirements?.map((req) => mapRequirementSummaryFromApi(req)!).filter(Boolean);

  return {
    id: dto.id,
    requirementRecordId: dto.requirementRecordId || dto.requirementId || (dto.requirementRecordIds?.[0] ?? ''),
    requirementRecordIds: dto.requirementRecordIds,
    requirement: mapRequirementSummaryFromApi(dto.requirement),
    requirements: reqSummaries ?? (dto.requirement ? [mapRequirementSummaryFromApi(dto.requirement)!] : undefined),
    status: dto.status,
    createdBy: dto.createdBy ?? '',
    currentOwnerRole: normalizeRole(dto.currentOwnerRole),
    notes: dto.notes ?? '',
    lineItemsCount: dto.lineItemsCount,
    approvalsCount: dto.approvalsCount,
    lineItems: dto.lineItems?.map((item) => mapLineItemFromApi(item, dto.id)),
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt ?? '',
  };
}

export function mapMappingToApi(
  data: Partial<Mapping> & { requirementRecordIds?: string[]; requirementRecordId?: string }
): CreateMappingApiDto {
  const reqIds =
    data.requirementRecordIds && data.requirementRecordIds.length > 0
      ? data.requirementRecordIds
      : data.requirementRecordId
      ? [data.requirementRecordId]
      : [];

  const payload: CreateMappingApiDto = {
    requirementRecordIds: reqIds,
  };

  if (data.requirementRecordId) payload.requirementRecordId = data.requirementRecordId;
  if (data.status) payload.status = data.status;
  if (data.createdBy) payload.createdBy = data.createdBy;
  if (data.currentOwnerRole) payload.currentOwnerRole = data.currentOwnerRole;
  if (data.notes !== undefined) payload.notes = data.notes;

  return payload;
}

export function mapMappingUpdateToApi(data: Partial<Mapping>): UpdateMappingApiDto {
  const payload: UpdateMappingApiDto = {};

  if (data.status !== undefined) payload.status = data.status;
  if (data.currentOwnerRole !== undefined) payload.currentOwnerRole = data.currentOwnerRole;
  if (data.notes !== undefined) payload.notes = data.notes;

  return payload;
}

export function mapLineItemToApi(
  data: Partial<MappingLineItem>
): CreateMappingLineItemApiDto {
  if (!data.candidateId) {
    throw new Error('candidateId is required to add a mapping line item');
  }

  const payload: CreateMappingLineItemApiDto = {
    candidateId: data.candidateId,
  };

  if (data.proposedTech !== undefined) {
    let techStr = '';
    if (typeof data.proposedTech === 'string') {
      techStr = data.proposedTech;
    } else if (data.proposedTech && typeof data.proposedTech === 'object') {
      techStr = (data.proposedTech as any).label || (data.proposedTech as any).name || (data.proposedTech as any).id || '';
    }
    payload.proposedTech = techStr;
  }
  if (data.allocationType) payload.allocationType = data.allocationType;

  return payload;
}

export function mapApprovalFromApi(dto: ApprovalApiDto): Approval {
  return {
    id: dto.id,
    mappingId: dto.mappingId,
    actorRole: normalizeRole(dto.actorRole),
    actorId: dto.actorId ?? '',
    decision: dto.decision,
    comment: dto.comment ?? '',
    timestamp: dto.timestamp ?? dto.createdAt ?? '',
  };
}

export function mapApprovalToApi(
  data: Pick<Approval, 'mappingId' | 'actorRole' | 'decision'> & Partial<Approval>
): CreateApprovalApiDto {
  const payload: CreateApprovalApiDto = {
    mappingId: data.mappingId,
    actorRole: data.actorRole,
    decision: data.decision,
  };

  if (data.actorId) payload.actorId = data.actorId;
  if (data.comment !== undefined) payload.comment = data.comment;

  return payload;
}

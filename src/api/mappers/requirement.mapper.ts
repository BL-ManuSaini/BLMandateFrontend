import type { Requirement, RequirementStatus } from '../../types';
import type {
  CreateRequirementApiDto,
  RequirementApiDto,
  RequirementApiStatus,
  UpdateRequirementApiDto,
} from '../types/requirement';
import { toApiDateTime } from './mandate.mapper';

function mapStatusFromApi(status: RequirementApiStatus): RequirementStatus {
  if (status === 'filled') return 'fulfilled';
  return status;
}

function mapStatusToApi(status: RequirementStatus): RequirementApiStatus {
  if (status === 'fulfilled') return 'filled';
  return status;
}

/** Safely extract a plain string from techStack — handles string, {id, label}, {name} objects */
function extractTechString(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.label || val.name || val.id || '';
  return String(val);
}

export function mapRequirementFromApi(dto: RequirementApiDto): Requirement {
  return {
    id: dto.id,
    mandateId: dto.mandateId,
    rid: dto.rid,
    clientName: dto.clientName,
    requirementId: dto.requirementId,
    techStack: extractTechString(dto.techStack || dto.techStackName || dto.techStackId),
    intakeType: extractTechString(dto.intakeType),
    expLevel: dto.expLevel ?? '',
    location: dto.location || dto.locationName || dto.locationId || '',
    onboardingDate: dto.onboardingDate ?? '',
    openPositions: dto.openPositions ?? 0,
    filledPositions: dto.filledPositions ?? 0,
    status: mapStatusFromApi(dto.status),
    targetCoeIds: dto.targetCoeIds ?? [],
    mappingsCount: dto.mappingsCount,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt,
  };
}

export function mapRequirementToApi(
  data: Partial<Requirement> & Pick<Requirement, 'mandateId' | 'techStack' | 'intakeType' | 'location'>
): CreateRequirementApiDto {
  const payload: CreateRequirementApiDto = {
    mandateId: data.mandateId,
    techStackName: extractTechString(data.techStack),
    intakeType: data.intakeType,
    locationName: data.location,
  };

  if (data.expLevel) payload.expLevel = data.expLevel;
  if (data.onboardingDate) payload.onboardingDate = toApiDateTime(data.onboardingDate);
  if (data.openPositions !== undefined) payload.openPositions = data.openPositions;
  if (data.status) payload.status = mapStatusToApi(data.status);
  if (data.targetCoeIds?.length) payload.targetCoeIds = data.targetCoeIds;

  return payload;
}

export function mapRequirementUpdateToApi(data: Partial<Requirement>): UpdateRequirementApiDto {
  const payload: UpdateRequirementApiDto = {};

  if (data.techStack !== undefined) payload.techStackName = extractTechString(data.techStack);
  if (data.intakeType !== undefined) payload.intakeType = data.intakeType;
  if (data.expLevel !== undefined) payload.expLevel = data.expLevel;
  if (data.location !== undefined) payload.locationName = data.location;
  if (data.onboardingDate !== undefined) payload.onboardingDate = toApiDateTime(data.onboardingDate);
  if (data.openPositions !== undefined) payload.openPositions = data.openPositions;
  if (data.filledPositions !== undefined) payload.filledPositions = data.filledPositions;
  if (data.status !== undefined) payload.status = mapStatusToApi(data.status);
  if (data.targetCoeIds !== undefined) payload.targetCoeIds = data.targetCoeIds;

  return payload;
}


import type { Mandate, MandateRequirementSummary, MandateStatus } from '../../types';
import { getSafeString } from '../../utils';
import type {
  CreateMandateApiDto,
  MandateApiDto,
  MandateApiStatus,
  MandateRequirementSummaryDto,
  UpdateMandateApiDto,
} from '../types/mandate';

export function toApiDateTime(date: string): string {
  if (date.includes('T')) return date;
  return `${date}T00:00:00.000Z`;
}

export function toFormDate(isoDate: string): string {
  return isoDate.split('T')[0] ?? isoDate;
}

function mapStatusFromApi(status: MandateApiStatus): MandateStatus {
  return status;
}

function mapRequirementSummaryFromApi(
  req: MandateRequirementSummaryDto
): MandateRequirementSummary {
  const techStackLabel = getSafeString(req.techStack);
  const locationLabel = getSafeString(req.location);
  const techStackObj =
    req.techStack && typeof req.techStack === 'object' ? req.techStack : undefined;
  const locationObj =
    req.location && typeof req.location === 'object' ? req.location : undefined;

  return {
    id: req.id,
    requirementId: req.requirementId,
    techStack: techStackLabel,
    location: locationLabel,
    techStackId: techStackObj?.id,
    locationId: locationObj?.id,
    status: req.status,
    openPositions: req.openPositions,
    filledPositions: req.filledPositions,
    intakeType: req.intakeType ?? req.engagementModel,
    techStackRef: techStackObj
      ? { id: techStackObj.id, label: techStackObj.label }
      : undefined,
    locationRef: locationObj
      ? {
          id: locationObj.id,
          label: locationObj.label,
          city: locationObj.city,
          state: locationObj.state,
        }
      : undefined,
  };
}

function deriveTechStacks(
  dto: MandateApiDto,
  requirements: MandateRequirementSummary[]
): string[] {
  if (Array.isArray(dto.techStacks) && dto.techStacks.length > 0) {
    return dto.techStacks.map((t) => getSafeString(t)).filter(Boolean);
  }
  return Array.from(
    new Set(requirements.map((r) => r.techStack).filter(Boolean))
  );
}

export function mapMandateFromApi(dto: MandateApiDto): Mandate {
  const requirements = (dto.requirements ?? []).map(mapRequirementSummaryFromApi);

  return {
    id: dto.id,
    clientId: dto.clientId ?? '',
    mandateName: dto.mandateName ?? '',
    clientName: dto.clientName,
    shortName: dto.shortName,
    mandateType: dto.mandateType,
    contractRef: dto.contractRef ?? '',
    startDate: dto.startDate ?? '',
    onboardingDate: dto.onboardingDate ?? '',
    // Table Locations column: trust backend unique locationSummary
    locations: dto.locationSummary ?? dto.locations ?? [],
    techStacks: deriveTechStacks(dto, requirements),
    notes: dto.notes ?? '',
    status: mapStatusFromApi(dto.status),
    createdBy: dto.createdBy ?? '',
    requirementsCount: dto.requirementsCount ?? requirements.length,
    requirements,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt,
  };
}

export function mapMandateToApi(
  data: Partial<Mandate> & { mandateType: string } & { clientName?: string; requirements?: any[] }
): CreateMandateApiDto {
  const payload: CreateMandateApiDto = {
    mandateType: data.mandateType,
  };

  if (data.clientName) payload.clientName = data.clientName;
  if (data.shortName) payload.shortName = data.shortName;
  if (data.contractRef) payload.contractRef = data.contractRef;
  if (data.startDate) payload.startDate = toApiDateTime(data.startDate);
  if (data.onboardingDate) payload.onboardingDate = toApiDateTime(data.onboardingDate);
  if (data.locations?.length) payload.locations = data.locations;
  if (data.techStacks?.length) payload.techStacks = data.techStacks;
  if (data.notes) payload.notes = data.notes;
  if (data.status) payload.status = data.status;
  if (data.requirements) payload.requirements = data.requirements;

  return payload;
}

export function mapMandateUpdateToApi(data: Partial<Mandate>): UpdateMandateApiDto {
  const payload: UpdateMandateApiDto = {};

  if (data.shortName !== undefined) payload.shortName = data.shortName;
  if (data.mandateType !== undefined) payload.mandateType = data.mandateType;
  if (data.contractRef !== undefined) payload.contractRef = data.contractRef;
  if (data.startDate !== undefined) payload.startDate = toApiDateTime(data.startDate);
  if (data.onboardingDate !== undefined) payload.onboardingDate = toApiDateTime(data.onboardingDate);
  if (data.locations !== undefined) payload.locations = data.locations;
  if (data.techStacks !== undefined) payload.techStacks = data.techStacks;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.status !== undefined) payload.status = data.status;

  return payload;
}

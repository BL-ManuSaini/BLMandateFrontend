export type MandateApiStatus = 'draft' | 'active' | 'on_hold' | 'closed' | 'cancelled';

export type MandateApiType =
  | 'NEW'
  | 'EXPANSION'
  | 'RENEW'
  | 'REPLACEMENT'
  | 'EXT'
  | 'SUB';

export interface MandateLocationRefDto {
  id: string;
  label: string;
  city?: string;
  state?: string;
}

export interface MandateTechStackRefDto {
  id: string;
  label: string;
}

export interface MandateRequirementSummaryDto {
  id: string;
  requirementId?: string;
  techStack?: MandateTechStackRefDto | string;
  location?: MandateLocationRefDto | string;
  status?: string;
  openPositions?: number;
  filledPositions?: number;
  intakeType?: string;
  engagementModel?: string;
}

export interface MandateApiDto {
  id: string;
  clientId?: string;
  clientName?: string;
  mandateName?: string;
  shortName?: string;
  mandateType: MandateApiType | string;
  contractRef?: string | null;
  startDate?: string;
  onboardingDate?: string;
  /** @deprecated Prefer locationSummary from GET responses */
  locations?: string[];
  /** Unique location labels across this mandate's requirements */
  locationSummary?: string[];
  techStacks?: string[];
  notes?: string | null;
  status: MandateApiStatus;
  createdBy?: string | null;
  requirementsCount?: number;
  requirements?: MandateRequirementSummaryDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMandateApiDto {
  clientId?: string;
  clientName?: string;
  mandateName?: string;
  shortName?: string;
  mandateType: MandateApiType | string;
  contractRef?: string;
  startDate?: string;
  onboardingDate?: string;
  locations?: string[];
  techStacks?: string[];
  notes?: string;
  status?: MandateApiStatus;
  requirements?: {
    techStack?: string;
    techStackName?: string;
    techStackId?: string;
    intakeType: string;
    location?: string;
    locationName?: string;
    openPositions: number;
  }[];
}

export interface UpdateMandateApiDto {
  clientId?: string;
  mandateName?: string;
  shortName?: string;
  mandateType?: MandateApiType | string;
  contractRef?: string;
  startDate?: string;
  onboardingDate?: string;
  locations?: string[];
  techStacks?: string[];
  notes?: string;
  status?: MandateApiStatus;
}

export interface MandateListParams {
  search?: string;
  status?: MandateApiStatus;
  clientId?: string;
}

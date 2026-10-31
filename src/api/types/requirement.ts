export type RequirementApiStatus = 'draft' | 'active' | 'on_hold' | 'filled' | 'cancelled';

export interface RequirementApiDto {
  id: string;
  mandateId: string;
  rid?: string;
  clientName?: string;
  requirementId: string;
  techStack?: any;
  techStackName?: string;
  techStackId?: string;
  intakeType: string;
  expLevel?: string;
  location?: any;
  locationName?: string;
  locationId?: string;
  onboardingDate?: string;
  openPositions?: number;
  filledPositions?: number;
  status: RequirementApiStatus;
  targetCoeIds?: string[];
  mappingsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRequirementApiDto {
  mandateId: string;
  techStackName?: string;
  techStackId?: string;
  intakeType: string;
  locationName?: string;
  locationId?: string;
  openPositions?: number;
  expLevel?: string;
  onboardingDate?: string;
  status?: RequirementApiStatus;
  targetCoeIds?: string[];
}

export interface UpdateRequirementApiDto {
  techStackName?: string;
  techStackId?: string;
  intakeType?: string;
  expLevel?: string;
  locationName?: string;
  locationId?: string;
  onboardingDate?: string;
  openPositions?: number;
  filledPositions?: number;
  status?: RequirementApiStatus;
  targetCoeIds?: string[];
}

export interface RequirementListParams {
  search?: string;
  status?: RequirementApiStatus;
  mandateId?: string;
  techStack?: string;
}

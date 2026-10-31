export type HiringDriveApiStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface HiringDriveApiDto {
  id: string;
  coeId: string;
  driveName: string;
  date: string;
  venue?: string;
  techCovered?: string[];
  requirementId?: string;
  coordinatorId?: string;
  notes?: string;
  status: HiringDriveApiStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHiringDriveApiDto {
  coeId: string;
  driveName: string;
  date: string;
  venue?: string;
  techCovered?: string[];
  coordinatorId?: string;
  requirementId?: string;
  notes?: string;
  status?: HiringDriveApiStatus;
}

export interface UpdateHiringDriveApiDto {
  driveName?: string;
  date?: string;
  venue?: string;
  techCovered?: string[];
  coordinatorId?: string;
  requirementId?: string;
  notes?: string;
  status?: HiringDriveApiStatus;
}

export interface HiringDriveListParams {
  search?: string;
  status?: HiringDriveApiStatus;
  coeId?: string;
  fromDate?: string;
  toDate?: string;
  requirementId?: string;
}

import type { HiringDrive } from '../../types';
import type {
  CreateHiringDriveApiDto,
  HiringDriveApiDto,
  UpdateHiringDriveApiDto,
} from '../types/hiring-drive';

function toApiDateTime(date: string): string {
  if (date.includes('T')) return date;
  return `${date}T00:00:00.000Z`;
}

export function mapHiringDriveFromApi(dto: HiringDriveApiDto): HiringDrive {
  return {
    id: dto.id,
    coeId: dto.coeId,
    driveName: dto.driveName,
    date: dto.date,
    venue: dto.venue ?? '',
    techCovered: dto.techCovered ?? [],
    coordinatorId: dto.coordinatorId ?? '',
    notes: dto.notes ?? '',
    status: dto.status,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt,
  };
}

export function mapHiringDriveToApi(
  data: Partial<HiringDrive> & Pick<HiringDrive, 'coeId' | 'driveName' | 'date'>
): CreateHiringDriveApiDto {
  const payload: CreateHiringDriveApiDto = {
    coeId: data.coeId,
    driveName: data.driveName,
    date: toApiDateTime(data.date),
  };

  if (data.venue) payload.venue = data.venue;
  if (data.techCovered?.length) payload.techCovered = data.techCovered;
  if (data.coordinatorId) payload.coordinatorId = data.coordinatorId;
  if (data.notes) payload.notes = data.notes;
  if (data.status) payload.status = data.status;

  return payload;
}

export function mapHiringDriveUpdateToApi(
  data: Partial<HiringDrive>
): UpdateHiringDriveApiDto {
  const payload: UpdateHiringDriveApiDto = {};

  if (data.driveName !== undefined) payload.driveName = data.driveName;
  if (data.date !== undefined) payload.date = toApiDateTime(data.date);
  if (data.venue !== undefined) payload.venue = data.venue;
  if (data.techCovered !== undefined) payload.techCovered = data.techCovered;
  if (data.coordinatorId !== undefined) payload.coordinatorId = data.coordinatorId;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.status !== undefined) payload.status = data.status;

  return payload;
}

export function toFormDate(isoDate: string): string {
  return isoDate.split('T')[0] ?? isoDate;
}

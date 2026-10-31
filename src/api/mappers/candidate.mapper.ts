import type { Candidate, CandidateStatus } from '../../types';
import type {
  CandidateApiDto,
  CandidateApiStatus,
  CreateCandidateApiDto,
  ImportCandidateApiDto,
  UpdateCandidateApiDto,
} from '../types/candidate';

/** COE id is a UUID string (Mandate Service), matching HiringDrive integration. */
export function mapCoeIdFromApi(coeId: string | number): string {
  return String(coeId);
}

export function mapCoeIdToApi(coeId: string): string {
  return coeId;
}

function mapStatusFromApi(status: CandidateApiStatus): CandidateStatus {
  return status;
}

function mapStatusToApi(status: CandidateStatus): CandidateApiStatus {
  return status as CandidateApiStatus;
}

function resolveCandidateId(dto: CandidateApiDto): string {
  if (dto.id) return dto.id;
  if (dto.candidateId) return dto.candidateId;
  if (dto._id) return String(dto._id);
  if (dto.externalKey) return dto.externalKey;
  return '';
}

export function mapCandidateFromApi(dto: CandidateApiDto): Candidate {
  const id = resolveCandidateId(dto);
  return {
    id,
    coeId: mapCoeIdFromApi(dto.coeId),
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    graduationYear: dto.graduationYear,
    stream: dto.stream,
    skills: dto.skills ?? [],
    resumeLink: dto.resumeLink ?? '',
    cgpa: dto.cgpa ?? 0,
    status: mapStatusFromApi(dto.status),
    externalKey: dto.externalKey ?? '',
    availabilityDate: dto.availabilityDate,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt,
    rollNumber: dto.rollNumber,
    coeName: dto.coeName,
    isActive: dto.isActive,
    isDeleted: dto.isDeleted,
  };
}

export function mapCandidateToApi(
  data: Partial<Candidate> & Pick<Candidate, 'name' | 'email' | 'phone' | 'coeId' | 'graduationYear' | 'stream'>
): CreateCandidateApiDto {
  const payload: CreateCandidateApiDto = {
    coeId: mapCoeIdToApi(data.coeId),
    name: data.name,
    email: data.email,
    phone: data.phone,
    graduationYear: data.graduationYear,
    stream: data.stream,
  };

  if (data.skills?.length) payload.skills = data.skills;
  if (data.resumeLink) payload.resumeLink = data.resumeLink;
  if (data.cgpa !== undefined) payload.cgpa = data.cgpa;
  if (data.status) payload.status = mapStatusToApi(data.status);
  if (data.availabilityDate) payload.availabilityDate = data.availabilityDate;
  if (data.rollNumber) payload.rollNumber = data.rollNumber;
  if (data.coeName) payload.coeName = data.coeName;

  return payload;
}

export function mapCandidateUpdateToApi(data: Partial<Candidate>): UpdateCandidateApiDto {
  const payload: UpdateCandidateApiDto = {};

  if (data.name !== undefined) payload.name = data.name;
  if (data.email !== undefined) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.coeId !== undefined) payload.coeId = mapCoeIdToApi(data.coeId);
  if (data.graduationYear !== undefined) payload.graduationYear = data.graduationYear;
  if (data.stream !== undefined) payload.stream = data.stream;
  if (data.skills !== undefined) payload.skills = data.skills;
  if (data.cgpa !== undefined) payload.cgpa = data.cgpa;
  if (data.status !== undefined) payload.status = mapStatusToApi(data.status);
  if (data.availabilityDate !== undefined) payload.availabilityDate = data.availabilityDate;
  if (data.rollNumber !== undefined) payload.rollNumber = data.rollNumber;
  if (data.coeName !== undefined) payload.coeName = data.coeName;

  return payload;
}

export function mapImportRowToApi(row: ImportCandidateApiDto): ImportCandidateApiDto {
  return {
    coeName: row.coeName,
    rollNumber: row.rollNumber,
    name: row.name,
    email: row.email,
    phone: row.phone,
    graduationYear: row.graduationYear,
    stream: row.stream,
    ...(row.skills?.length ? { skills: row.skills } : {}),
    ...(row.resumeLink ? { resumeLink: row.resumeLink } : {}),
    ...(row.cgpa !== undefined ? { cgpa: row.cgpa } : {}),
    ...(row.status ? { status: row.status } : {}),
    ...(row.availabilityDate ? { availabilityDate: row.availabilityDate } : {}),
  };
}

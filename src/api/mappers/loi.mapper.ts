import type { LOI } from '../../types';
import type { CreateLoiApiDto, LoiApiDto, SignLoiApiDto, UpdateLoiApiDto } from '../types/loi';

export function mapLoiFromApi(dto: LoiApiDto): LOI {
  return {
    id: dto.id,
    candidateId: dto.candidateId,
    requirementRecordId: dto.requirementRecordId || dto.requirementId || '',
    mappingId: dto.mappingId ?? '',
    sentAt: dto.sentAt ?? '',
    signedAt: dto.signedAt ?? null,
    documentUrl: dto.documentUrl ?? '',
    status: dto.status,
  };
}

export function mapLoiToApi(
  data: Pick<LOI, 'candidateId'> & Partial<LOI>
): CreateLoiApiDto {
  const payload: CreateLoiApiDto = {
    candidateId: data.candidateId,
  };

  if (data.requirementRecordId) payload.requirementRecordId = data.requirementRecordId;
  if (data.mappingId) payload.mappingId = data.mappingId;
  if (data.sentAt) payload.sentAt = data.sentAt;
  if (data.documentUrl) payload.documentUrl = data.documentUrl;
  if (data.status) payload.status = data.status;

  return payload;
}

export function mapLoiUpdateToApi(data: Partial<LOI>): UpdateLoiApiDto {
  const payload: UpdateLoiApiDto = {};

  if (data.sentAt !== undefined) payload.sentAt = data.sentAt;
  if (data.signedAt !== undefined && data.signedAt !== null) payload.signedAt = data.signedAt;
  if (data.documentUrl !== undefined) payload.documentUrl = data.documentUrl;
  if (data.status !== undefined) payload.status = data.status;

  return payload;
}

export function mapLoiSignToApi(signedAt?: string): SignLoiApiDto {
  return signedAt ? { signedAt } : {};
}

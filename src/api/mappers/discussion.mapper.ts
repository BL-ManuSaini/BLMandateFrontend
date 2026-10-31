import type { DiscussionLog } from '../../types';
import type {
  CreateDiscussionLogApiDto,
  DiscussionLogApiDto,
} from '../types/discussion';

function toApiFollowUpDate(followUpDate: string | null | undefined): string | undefined {
  if (!followUpDate) return undefined;
  if (followUpDate.includes('T')) return followUpDate;
  return `${followUpDate}T00:00:00.000Z`;
}

export function mapDiscussionLogFromApi(dto: DiscussionLogApiDto): DiscussionLog {
  return {
    id: dto.id,
    mappingLineItemId: dto.mappingLineItemId,
    coordinatorId: dto.coordinatorId,
    outcome: dto.outcome,
    notes: dto.notes ?? '',
    followUpDate: dto.followUpDate ?? null,
    createdAt: dto.createdAt ?? '',
  };
}

export function mapDiscussionLogToApi(
  data: Pick<DiscussionLog, 'mappingLineItemId' | 'coordinatorId' | 'outcome'> &
    Partial<DiscussionLog>
): CreateDiscussionLogApiDto {
  const payload: CreateDiscussionLogApiDto = {
    mappingLineItemId: data.mappingLineItemId,
    coordinatorId: data.coordinatorId,
    outcome: data.outcome,
  };

  if (data.notes !== undefined) payload.notes = data.notes;
  const followUpDate = toApiFollowUpDate(data.followUpDate);
  if (followUpDate) payload.followUpDate = followUpDate;

  return payload;
}

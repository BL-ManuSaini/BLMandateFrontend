import type { DiscussionOutcome } from '../../types';

export type DiscussionApiOutcome = DiscussionOutcome;

export interface DiscussionLogApiDto {
  id: string;
  mappingLineItemId: string;
  coordinatorId: string;
  outcome: DiscussionApiOutcome;
  notes?: string | null;
  followUpDate?: string | null;
  createdAt?: string;
}

export interface CreateDiscussionLogApiDto {
  mappingLineItemId: string;
  coordinatorId: string;
  outcome: DiscussionApiOutcome;
  notes?: string;
  followUpDate?: string;
}

export interface DiscussionLogListParams {
  mappingLineItemId?: string;
  coordinatorId?: string;
  outcome?: DiscussionApiOutcome;
}

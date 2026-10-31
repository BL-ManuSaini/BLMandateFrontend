import type { Mapping, MappingStatus, UserRole } from '../../types';
import { approvalService } from './approval.service';
import { mappingService } from './mapping.service';

/** Roles allowed to PATCH /mappings/{id} per backend RBAC. */
const MAPPING_PATCH_ROLES: UserRole[] = [
  'MIS_MANAGER',
  'ACCOUNT_MANAGER',
  'COE_LAB_HEAD',
];

function canPatchMapping(role: UserRole): boolean {
  return MAPPING_PATCH_ROLES.includes(role);
}

export interface MappingWorkflowActor {
  role: UserRole;
  id: string;
}

export interface MappingWorkflowParams {
  mappingId: string;
  actor: MappingWorkflowActor;
  comment?: string;
}

export interface MappingApproveParams extends MappingWorkflowParams {
  nextStatus: MappingStatus;
}

export const mappingWorkflowService = {
  /** Submit draft for engineering review — status PATCH only (not an approval). */
  submitForReview: async ({
    mappingId,
    comment,
  }: MappingWorkflowParams): Promise<Mapping> =>
    mappingService.update(mappingId, {
      status: 'Engineering Review',
      ...(comment ? { notes: comment } : {}),
    }),

  /** Reviewer approve — POST approval; PATCH status only when role has mapping update access. */
  approve: async ({
    mappingId,
    actor,
    nextStatus,
    comment,
  }: MappingApproveParams): Promise<Mapping> => {
    await approvalService.create({
      mappingId,
      actorRole: actor.role,
      actorId: actor.id,
      decision: 'Approved',
      comment: comment ?? '',
    });

    if (canPatchMapping(actor.role)) {
      return mappingService.update(mappingId, { status: nextStatus });
    }

    return mappingService.getById(mappingId);
  },

  /** Reviewer reject — POST approval; PATCH to Draft only when role has mapping update access. */
  reject: async ({
    mappingId,
    actor,
    comment,
  }: MappingWorkflowParams): Promise<Mapping> => {
    await approvalService.create({
      mappingId,
      actorRole: actor.role,
      actorId: actor.id,
      decision: 'Rejected',
      comment: comment ?? '',
    });

    if (canPatchMapping(actor.role)) {
      return mappingService.update(mappingId, { status: 'Draft' });
    }

    return mappingService.getById(mappingId);
  },

  advanceStatus: async (
    mappingId: string,
    nextStatus: MappingStatus
  ): Promise<Mapping> => mappingService.update(mappingId, { status: nextStatus }),
};

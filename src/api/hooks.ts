import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { candidateService } from './services/candidate.service';
import { hiringDriveService } from './services/hiring-drive.service';
import { mandateService } from './services/mandate.service';
import { requirementService } from './services/requirement.service';
import { mappingService } from './services/mapping.service';
import { approvalService } from './services/approval.service';
import { mappingWorkflowService } from './services/mappingWorkflow.service';
import { discussionService } from './services/discussion.service';
import { loiService } from './services/loi.service';
import type { CandidateListParams, ImportCandidateApiDto } from './types/candidate';
import type { DiscussionLogListParams } from './types/discussion';
import type { LoiListParams } from './types/loi';
import type { HiringDriveListParams } from './types/hiring-drive';
import type { MandateListParams } from './types/mandate';
import type { RequirementListParams } from './types/requirement';
import type { ApprovalListParams, MappingListParams } from './types/mapping';
import type { MappingApproveParams, MappingWorkflowParams } from './services/mappingWorkflow.service';
import type {
  User, COE, Client, Mandate, Requirement, HiringDrive, Candidate,
  Mapping, MappingLineItem, Approval, DiscussionLog, LOI,
  Notification, AuditEvent, Role,
} from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users') });

export const useUser = (id: string) =>
  useQuery({ queryKey: ['users', id], queryFn: () => api.get<User>(`/users/${id}`), enabled: !!id });

export const useRoles = (params?: { includeInactive?: string }) =>
  useQuery({
    queryKey: ['roles', params],
    queryFn: () => api.get<Role[]>('/roles', params),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post<any>('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; email?: string; password?: string; roleId?: string; coeScopeIds?: string[] }) =>
      api.patch<any>(`/users/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// ─── COEs ─────────────────────────────────────────────────────────────────────
export const useCOEs = () =>
  useQuery({ queryKey: ['coes'], queryFn: () => api.get<COE[]>('/coes') });

export const useCOE = (id: string) =>
  useQuery({ queryKey: ['coes', id], queryFn: () => api.get<COE>(`/coes/${id}`), enabled: !!id });

export const useCreateCOE = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<COE, 'name' | 'location' | 'spoc' | 'studentsCount'>) =>
      api.post<COE>('/coes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coes'] });
    },
  });
};

export const useUpdateCOE = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<COE> & { id: string }) =>
      api.patch<COE>(`/coes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coes'] });
    },
  });
};

export const useDeleteCOE = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/coes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coes'] });
    },
  });
};

// ─── Clients ──────────────────────────────────────────────────────────────────
export const useClients = () =>
  useQuery({ queryKey: ['clients'], queryFn: () => api.get<Client[]>('/clients') });

// ─── Mandates ─────────────────────────────────────────────────────────────────
export const useMandates = (params?: MandateListParams) =>
  useQuery({
    queryKey: ['mandates', params],
    queryFn: () => mandateService.list(params),
  });

export const useMandate = (id: string) =>
  useQuery({
    queryKey: ['mandates', id],
    queryFn: () => mandateService.getById(id),
    enabled: !!id,
  });

export const useCreateMandate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Mandate> & { mandateType: string } & { clientName?: string; requirements?: any[] }
    ) => mandateService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates'] }),
  });
};

export const useUpdateMandate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Mandate> & { id: string }) =>
      mandateService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates'] }),
  });
};


export const useDeleteMandate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mandateService.delete(id), 
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates'] }),
  });
};


// ─── Requirements ─────────────────────────────────────────────────────────────
export const useRequirements = (params?: RequirementListParams) =>
  useQuery({
    queryKey: ['requirements', params],
    queryFn: () => requirementService.list(params),
  });

export const useRequirement = (id: string) =>
  useQuery({
    queryKey: ['requirements', id],
    queryFn: () => requirementService.getById(id),
    enabled: !!id,
  });

export const useCreateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Requirement> & Pick<Requirement, 'mandateId' | 'techStack' | 'intakeType' | 'location'>
    ) => requirementService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements'] }),
  });
};

export const useUpdateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Requirement> & { id: string }) =>
      requirementService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements'] }),
  });
};

export const useDeleteRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => requirementService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements'] }),
  });
};

// ─── Hiring Drives (Hiring Drive Service) ───────────────────────────────────
export const useHiringDrives = (params?: HiringDriveListParams) =>
  useQuery({
    queryKey: ['hiringDrives', params],
    queryFn: () => hiringDriveService.list(params),
  });

export const useHiringDrive = (id: string) =>
  useQuery({
    queryKey: ['hiringDrives', id],
    queryFn: () => hiringDriveService.getById(id),
    enabled: !!id,
  });

export const useCreateHiringDrive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<HiringDrive> & Pick<HiringDrive, 'coeId' | 'driveName' | 'date'>
    ) => hiringDriveService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hiringDrives'] }),
  });
};

export const useUpdateHiringDrive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<HiringDrive> & { id: string }) =>
      hiringDriveService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hiringDrives'] }),
  });
};

export const useDeleteHiringDrive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hiringDriveService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hiringDrives'] }),
  });
};

// ─── Candidates (Hiring Drive Service) ────────────────────────────────────────
export const useCandidates = (params?: CandidateListParams) =>
  useQuery({
    queryKey: ['candidates', params],
    queryFn: () => candidateService.list(params),
  });

export const useCandidate = (id: string) =>
  useQuery({
    queryKey: ['candidates', id],
    queryFn: () => candidateService.getById(id),
    enabled: !!id,
  });

export const useCreateCandidate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Candidate> & Pick<Candidate, 'name' | 'email' | 'phone' | 'coeId' | 'graduationYear' | 'stream'>
    ) => candidateService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
};

export const useUpdateCandidate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Candidate> & { id: string }) =>
      candidateService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
};

export const useImportCandidates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportCandidateApiDto[]) => candidateService.import(rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
};

export const useDeleteCandidate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => candidateService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  });
};

// ─── Mappings ─────────────────────────────────────────────────────────────────
function invalidateMappingQueries(qc: ReturnType<typeof useQueryClient>, mappingId?: string) {
  qc.invalidateQueries({ queryKey: ['mappings'] });
  if (mappingId) {
    qc.invalidateQueries({ queryKey: ['mappings', mappingId] });
  }
}

export const useMappings = (params?: MappingListParams) =>
  useQuery({
    queryKey: ['mappings', params],
    queryFn: () => mappingService.list(params),
  });

export const useMapping = (id: string) =>
  useQuery({
    queryKey: ['mappings', id],
    queryFn: () => mappingService.getById(id),
    enabled: !!id,
  });

export const useCreateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Mapping> & { requirementRecordIds?: string[]; requirementRecordId?: string }) =>
      mappingService.create(data),
    onSuccess: () => invalidateMappingQueries(qc),
  });
};

export const useUpdateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Mapping> & { id: string }) =>
      mappingService.update(id, data),
    onSuccess: (_data, variables) => invalidateMappingQueries(qc, variables.id),
  });
};

export const useDeleteMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mappingService.delete(id),
    onSuccess: () => invalidateMappingQueries(qc),
  });
};

// ─── Mapping Line Items ───────────────────────────────────────────────────────
export const useMappingLineItems = (mappingId?: string) =>
  useQuery({
    queryKey: ['mappings', mappingId],
    queryFn: () => mappingService.getById(mappingId!),
    enabled: !!mappingId,
    select: (mapping) => mapping.lineItems ?? [],
  });

export const useAllMappingLineItems = () =>
  useQuery({
    queryKey: ['mappings'],
    queryFn: () => mappingService.list(),
    select: (mappings) =>
      mappings.flatMap((mapping) =>
        (mapping.lineItems ?? []).map((item) => ({
          ...item,
          mappingId: item.mappingId || mapping.id,
        }))
      ),
  });

export const useCreateMappingLineItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variables: Partial<MappingLineItem> & { mappingId: string }) => {
      const { mappingId, ...data } = variables;
      return mappingService.addLineItem(mappingId, data);
    },
    onSuccess: (_data, variables) => {
      invalidateMappingQueries(qc, variables.mappingId);
      qc.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

export const useDeleteMappingLineItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mappingId,
      lineItemId,
    }: {
      mappingId: string;
      lineItemId: string;
    }) => mappingService.removeLineItem(mappingId, lineItemId),
    onSuccess: (_data, variables) => invalidateMappingQueries(qc, variables.mappingId),
  });
};

// ─── Approvals ────────────────────────────────────────────────────────────────
export const useApprovals = (params?: ApprovalListParams) =>
  useQuery({
    queryKey: ['approvals', params],
    queryFn: () =>
      params?.mappingId
        ? approvalService.listByMapping(params.mappingId)
        : approvalService.list(params),
    enabled: params?.mappingId !== undefined ? !!params.mappingId : true,
  });

export const useCreateApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<Approval, 'mappingId' | 'actorRole' | 'decision'> & Partial<Approval>
    ) => approvalService.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      invalidateMappingQueries(qc, variables.mappingId);
    },
  });
};

// ─── Mapping Workflow ─────────────────────────────────────────────────────────
export const useSubmitMappingForReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: MappingWorkflowParams) =>
      mappingWorkflowService.submitForReview(params),
    onSuccess: (_data, variables) => {
      invalidateMappingQueries(qc, variables.mappingId);
    },
  });
};

export const useApproveMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: MappingApproveParams) => mappingWorkflowService.approve(params),
    onSuccess: (_data, variables) => {
      invalidateMappingQueries(qc, variables.mappingId);
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
};

export const useRejectMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: MappingWorkflowParams) => mappingWorkflowService.reject(params),
    onSuccess: (_data, variables) => {
      invalidateMappingQueries(qc, variables.mappingId);
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
};

export const useAdvanceMappingStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      mappingId,
      status,
    }: {
      mappingId: string;
      status: Mapping['status'];
    }) => mappingWorkflowService.advanceStatus(mappingId, status),
    onSuccess: (_data, variables) => invalidateMappingQueries(qc, variables.mappingId),
  });
};

// ─── Discussion Logs ──────────────────────────────────────────────────────────
export const useDiscussionLogs = (params?: DiscussionLogListParams) =>
  useQuery({
    queryKey: ['discussionLogs', params],
    queryFn: () => discussionService.list(params),
  });

export const useCreateDiscussionLog = () => {
  
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Pick<DiscussionLog, 'mappingLineItemId' | 'coordinatorId' | 'outcome'> &
        Partial<DiscussionLog>
    ) => discussionService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussionLogs'] });
      qc.invalidateQueries({ queryKey: ['mappings'] });
    },
  });
};

export const useUpdateDiscussionLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<DiscussionLog> & { id: string }) =>
      discussionService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussionLogs'] });
    },
  });
};

export const useDeleteDiscussionLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => discussionService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussionLogs'] });
    },
  });
};

// ─── LOIs ─────────────────────────────────────────────────────────────────────
export const useLOIs = (params?: LoiListParams) =>
  useQuery({
    queryKey: ['lois', params],
    queryFn: () => loiService.list(params),
  });

export const useCreateLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<LOI, 'candidateId'> & Partial<LOI> & { loiLetter?: File }) => loiService.create(data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['lois'] });
      if (variables.mappingId) invalidateMappingQueries(qc, variables.mappingId);
    },
  });
};

export const useUpdateLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LOI> & { id: string }) =>
      loiService.update(id, data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['lois'] });
      if (data.mappingId) invalidateMappingQueries(qc, data.mappingId);
    },
  });
};

export const useSignLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signedAt }: { id: string; signedAt?: string }) =>
      loiService.sign(id, signedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['lois'] });
      if (data.mappingId) invalidateMappingQueries(qc, data.mappingId);
    },
  });
};

export const useDeleteLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => loiService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lois'] });
    },
  });
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.get<Notification[]>('/notifications', userId ? { userId } : undefined),
    refetchInterval: 30000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}`, { read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ─── Audit Events ─────────────────────────────────────────────────────────────
// Temporarily disabled until backend route /api/auditEvents is ready
export const useAuditEvents = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: ['auditEvents', params],
    queryFn: async () => [] as AuditEvent[],
    enabled: false, // Disabled until backend route is ready
  });

export * from './hooks/useAuth';
export * from './hooks/useTechStacks';
export * from './hooks/useLocations';


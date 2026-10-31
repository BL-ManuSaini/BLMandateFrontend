import { mandateApi } from '../client/mandateClient';
import { mapApprovalFromApi, mapApprovalToApi } from '../mappers/mapping.mapper';
import type { Approval } from '../../types';
import type {
  ApprovalApiDto,
  ApprovalListParams,
  CreateApprovalApiDto,
} from '../types/mapping';

export const approvalService = {
  list: async (params?: ApprovalListParams): Promise<Approval[]> => {
    const dtos = await mandateApi.get<ApprovalApiDto[]>('/approvals', params);
    return dtos.map(mapApprovalFromApi);
  },

  listByMapping: async (mappingId: string): Promise<Approval[]> => {
    const dtos = await mandateApi.get<ApprovalApiDto[]>(`/approvals/mapping/${mappingId}`);
    return dtos.map(mapApprovalFromApi);
  },

  create: async (
    data: Pick<Approval, 'mappingId' | 'actorRole' | 'decision'> & Partial<Approval>
  ): Promise<Approval> => {
    const payload: CreateApprovalApiDto = mapApprovalToApi(data);
    const dto = await mandateApi.post<ApprovalApiDto>('/approvals', payload);
    return mapApprovalFromApi(dto);
  },
};

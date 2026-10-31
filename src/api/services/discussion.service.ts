import { mandateApi } from '../client/mandateClient';
import {
  mapDiscussionLogFromApi,
  mapDiscussionLogToApi,
} from '../mappers/discussion.mapper';
import type { DiscussionLog } from '../../types';
import type {
  DiscussionLogApiDto,
  DiscussionLogListParams,
} from '../types/discussion';

export const discussionService = {
  list: async (params?: DiscussionLogListParams): Promise<DiscussionLog[]> => {
    const dtos = await mandateApi.get<DiscussionLogApiDto[]>('/discussion-logs', params);
    return dtos.map(mapDiscussionLogFromApi);
  },

  listByLineItem: async (mappingLineItemId: string): Promise<DiscussionLog[]> => {
    const dtos = await mandateApi.get<DiscussionLogApiDto[]>(
      `/discussion-logs/line-item/${mappingLineItemId}`
    );
    return dtos.map(mapDiscussionLogFromApi);
  },

  create: async (
    data: Pick<DiscussionLog, 'mappingLineItemId' | 'coordinatorId' | 'outcome'> &
      Partial<DiscussionLog>
  ): Promise<DiscussionLog> => {
    const payload = mapDiscussionLogToApi(data);
    const dto = await mandateApi.post<DiscussionLogApiDto>('/discussion-logs', payload);
    return mapDiscussionLogFromApi(dto);
  },

  update: async (id: string, data: Partial<DiscussionLog>): Promise<DiscussionLog> => {
    const payload = mapDiscussionLogToApi(data as any);
    const dto = await mandateApi.patch<DiscussionLogApiDto>(`/discussion-logs/${id}`, payload);
    return mapDiscussionLogFromApi(dto);
  },

  delete: async (id: string): Promise<void> => {
    await mandateApi.delete(`/discussion-logs/${id}`);
  },
};

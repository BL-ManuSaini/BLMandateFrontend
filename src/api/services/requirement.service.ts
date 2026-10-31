import { mandateApi } from '../client/mandateClient';
import {
  mapRequirementFromApi,
  mapRequirementToApi,
  mapRequirementUpdateToApi,
} from '../mappers/requirement.mapper';
import type { Requirement } from '../../types';
import type {
  CreateRequirementApiDto,
  RequirementApiDto,
  RequirementListParams,
  UpdateRequirementApiDto,
} from '../types/requirement';

export const requirementService = {
  list: async (params?: RequirementListParams): Promise<Requirement[]> => {
    const dtos = await mandateApi.get<RequirementApiDto[]>('/requirements', params);
    return dtos.map(mapRequirementFromApi);
  },

  getById: async (id: string): Promise<Requirement> => {
    const dto = await mandateApi.get<RequirementApiDto>(`/requirements/${id}`);
    return mapRequirementFromApi(dto);
  },

  create: async (
    data: Partial<Requirement> & Pick<Requirement, 'mandateId' | 'techStack' | 'intakeType' | 'location'>
  ): Promise<Requirement> => {
    const payload: CreateRequirementApiDto = mapRequirementToApi(data);
    const dto = await mandateApi.post<RequirementApiDto>('/requirements', payload);
    return mapRequirementFromApi(dto);
  },

  update: async (id: string, data: Partial<Requirement>): Promise<Requirement> => {
    const payload: UpdateRequirementApiDto = mapRequirementUpdateToApi(data);
    const dto = await mandateApi.patch<RequirementApiDto>(`/requirements/${id}`, payload);
    return mapRequirementFromApi(dto);
  },

  delete: async (id: string): Promise<void> => {
    await mandateApi.delete(`/requirements/${id}`);
  },
};

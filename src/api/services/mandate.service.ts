import { mandateApi } from '../client/mandateClient';
import {
  mapMandateFromApi,
  mapMandateToApi,
  mapMandateUpdateToApi,
} from '../mappers/mandate.mapper';
import type { Mandate } from '../../types';
import type {
  CreateMandateApiDto,
  MandateApiDto,
  MandateListParams,
  UpdateMandateApiDto,
} from '../types/mandate';

export const mandateService = {
  list: async (params?: MandateListParams): Promise<Mandate[]> => {
    const dtos = await mandateApi.get<MandateApiDto[]>('/mandates', params);
    return dtos.map(mapMandateFromApi);
  },

  getById: async (id: string): Promise<Mandate> => {
    const dto = await mandateApi.get<MandateApiDto>(`/mandates/${id}`);
    return mapMandateFromApi(dto);
  },

  create: async (
    data: Partial<Mandate> & { mandateType: string } & { clientName?: string; requirements?: any[] }
  ): Promise<Mandate> => {
    const payload: CreateMandateApiDto = mapMandateToApi(data);
    const dto = await mandateApi.post<MandateApiDto>('/mandates', payload);
    return mapMandateFromApi(dto);
  },

  update: async (id: string, data: Partial<Mandate>): Promise<Mandate> => {
    const payload: UpdateMandateApiDto = mapMandateUpdateToApi(data);
    const dto = await mandateApi.patch<MandateApiDto>(`/mandates/${id}`, payload);
    return mapMandateFromApi(dto);
  },
  delete: async (id: string): Promise<void> => {
    await mandateApi.delete<void>(`/mandates/${id}`);
  },
};

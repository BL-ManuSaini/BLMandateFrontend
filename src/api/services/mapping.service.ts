import { mandateApi } from '../client/mandateClient';
import {
  mapLineItemFromApi,
  mapLineItemToApi,
  mapMappingFromApi,
  mapMappingToApi,
  mapMappingUpdateToApi,
} from '../mappers/mapping.mapper';
import type { Mapping, MappingLineItem } from '../../types';
import type {
  CreateMappingApiDto,
  CreateMappingLineItemApiDto,
  MappingApiDto,
  MappingLineItemApiDto,
  MappingListParams,
  UpdateMappingApiDto,
} from '../types/mapping';

export const mappingService = {
  list: async (params?: MappingListParams): Promise<Mapping[]> => {
    const dtos = await mandateApi.get<MappingApiDto[]>('/mappings', params);
    return dtos.map(mapMappingFromApi);
  },

  getById: async (id: string): Promise<Mapping> => {
    const dto = await mandateApi.get<MappingApiDto>(`/mappings/${id}`);
    return mapMappingFromApi(dto);
  },

  create: async (
    data: Partial<Mapping> & { requirementRecordIds?: string[]; requirementRecordId?: string }
  ): Promise<Mapping | Mapping[]> => {
    const payload: CreateMappingApiDto = mapMappingToApi(data);
    const dto = await mandateApi.post<MappingApiDto | MappingApiDto[]>('/mappings', payload);
    return Array.isArray(dto) ? dto.map(mapMappingFromApi) : mapMappingFromApi(dto);
  },

  update: async (id: string, data: Partial<Mapping>): Promise<Mapping> => {
    const payload: UpdateMappingApiDto = mapMappingUpdateToApi(data);
    const dto = await mandateApi.patch<MappingApiDto>(`/mappings/${id}`, payload);
    return mapMappingFromApi(dto);
  },

  addLineItem: async (
    mappingId: string,
    data: Partial<MappingLineItem>
  ): Promise<MappingLineItem> => {
    const payload: CreateMappingLineItemApiDto = mapLineItemToApi(data);
    const dto = await mandateApi.post<MappingLineItemApiDto>(
      `/mappings/${mappingId}/line-items`,
      payload
    );
    return mapLineItemFromApi(dto, mappingId);
  },

  removeLineItem: async (mappingId: string, lineItemId: string): Promise<void> => {
    await mandateApi.delete(`/mappings/${mappingId}/line-items/${lineItemId}`);
  },

  delete: async (id: string): Promise<void> => {
    await mandateApi.delete(`/mappings/${id}`);
  },
};

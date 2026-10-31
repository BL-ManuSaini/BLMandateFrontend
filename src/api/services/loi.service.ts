import { mandateApi, mandateClient } from '../client/mandateClient';
import {
  mapLoiFromApi,
  mapLoiSignToApi,
  mapLoiToApi,
  mapLoiUpdateToApi,
} from '../mappers/loi.mapper';
import type { LOI } from '../../types';
import type { LoiApiDto, LoiListParams } from '../types/loi';

export const loiService = {
  list: async (params?: LoiListParams): Promise<LOI[]> => {
    const dtos = await mandateApi.get<LoiApiDto[]>('/lois', params);
    return dtos.map(mapLoiFromApi);
  },

  getById: async (id: string): Promise<LOI> => {
    const dto = await mandateApi.get<LoiApiDto>(`/lois/${id}`);
    return mapLoiFromApi(dto);
  },

  create: async (data: Pick<LOI, 'candidateId'> & Partial<LOI> & { loiLetter?: File }): Promise<LOI> => {
    const formData = new FormData();
    formData.append('candidateId', data.candidateId);
    if (data.requirementRecordId) formData.append('requirementRecordId', data.requirementRecordId);
    if (data.mappingId) formData.append('mappingId', data.mappingId);
    if (data.sentAt) formData.append('sentAt', data.sentAt);
    if (data.status) formData.append('status', data.status);
    if (data.loiLetter) {
      formData.append('loiLetter', data.loiLetter);
    }

    const dto = await mandateClient.post<LoiApiDto>('/lois', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then((r) => r.data);
    return mapLoiFromApi(dto);
  },

  update: async (id: string, data: Partial<LOI>): Promise<LOI> => {
    const payload = mapLoiUpdateToApi(data);
    const dto = await mandateApi.patch<LoiApiDto>(`/lois/${id}`, payload);
    return mapLoiFromApi(dto);
  },

  sign: async (id: string, signedAt?: string): Promise<LOI> => {
    const payload = mapLoiSignToApi(signedAt);
    const dto = await mandateApi.post<LoiApiDto>(`/lois/${id}/sign`, payload);
    return mapLoiFromApi(dto);
  },

  delete: async (id: string): Promise<void> => {
    await mandateApi.delete(`/lois/${id}`);
  },
};

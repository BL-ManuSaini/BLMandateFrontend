import { hiringDriveApi } from '../client/hiringDriveClient';
import {
  mapHiringDriveFromApi,
  mapHiringDriveToApi,
  mapHiringDriveUpdateToApi,
} from '../mappers/hiring-drive.mapper';
import type { HiringDrive } from '../../types';
import type {
  CreateHiringDriveApiDto,
  HiringDriveApiDto,
  HiringDriveListParams,
  UpdateHiringDriveApiDto,
} from '../types/hiring-drive';

export const hiringDriveService = {
  list: async (params?: HiringDriveListParams): Promise<HiringDrive[]> => {
    const dtos = await hiringDriveApi.get<HiringDriveApiDto[]>('/hiring-drives', params);
    return dtos.map(mapHiringDriveFromApi);
  },

  getById: async (id: string): Promise<HiringDrive> => {
    const dto = await hiringDriveApi.get<HiringDriveApiDto>(`/hiring-drives/${id}`);
    return mapHiringDriveFromApi(dto);
  },

  create: async (
    data: Partial<HiringDrive> & Pick<HiringDrive, 'coeId' | 'driveName' | 'date'>
  ): Promise<HiringDrive> => {
    const payload: CreateHiringDriveApiDto = mapHiringDriveToApi(data);
    const dto = await hiringDriveApi.post<HiringDriveApiDto>('/hiring-drives', payload);
    return mapHiringDriveFromApi(dto);
  },

  update: async (id: string, data: Partial<HiringDrive>): Promise<HiringDrive> => {
    const payload: UpdateHiringDriveApiDto = mapHiringDriveUpdateToApi(data);
    const dto = await hiringDriveApi.patch<HiringDriveApiDto>(`/hiring-drives/${id}`, payload);
    return mapHiringDriveFromApi(dto);
  },

  delete: async (id: string): Promise<void> => {
    await hiringDriveApi.delete(`/hiring-drives/${id}`);
  },
};

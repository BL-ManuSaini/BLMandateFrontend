import { hiringDriveApi } from '../client/hiringDriveClient';
import {
  mapCandidateFromApi,
  mapCandidateToApi,
  mapCandidateUpdateToApi,
  mapImportRowToApi,
} from '../mappers/candidate.mapper';
import type { Candidate } from '../../types';
import type {
  CandidateApiDto,
  CandidateListParams,
  CreateCandidateApiDto,
  ImportCandidateApiDto,
  ImportCandidatesApiDto,
  ImportCandidatesResultDto,
  UpdateCandidateApiDto,
} from '../types/candidate';

export const candidateService = {
  list: async (params?: CandidateListParams): Promise<Candidate[]> => {
    const dtos = await hiringDriveApi.get<CandidateApiDto[]>('/candidates', params);
    return dtos.map(mapCandidateFromApi);
  },

  getById: async (id: string): Promise<Candidate> => {
    const dto = await hiringDriveApi.get<CandidateApiDto>(`/candidates/${id}`);
    return mapCandidateFromApi(dto);
  },

  create: async (
    data: Partial<Candidate> & Pick<Candidate, 'name' | 'email' | 'phone' | 'coeId' | 'graduationYear' | 'stream'>
  ): Promise<Candidate> => {
    const payload: CreateCandidateApiDto = mapCandidateToApi(data);
    const dto = await hiringDriveApi.post<CandidateApiDto>('/candidates', payload);
    return mapCandidateFromApi(dto);
  },

  update: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
    const payload: UpdateCandidateApiDto = mapCandidateUpdateToApi(data);
    const dto = await hiringDriveApi.patch<CandidateApiDto>(`/candidates/${id}`, payload);
    return mapCandidateFromApi(dto);
  },

  import: async (rows: ImportCandidateApiDto[]): Promise<ImportCandidatesResultDto> => {
    const payload: ImportCandidatesApiDto = {
      candidates: rows.map(mapImportRowToApi),
    };
    return hiringDriveApi.post<ImportCandidatesResultDto>('/candidates/import', payload);
  },

  delete: async (id: string): Promise<void> => {
    await hiringDriveApi.delete(`/candidates/${id}`);
  },
};

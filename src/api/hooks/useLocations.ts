import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../client';

export interface LocationOption {
  id?: string;
  name: string;
}

export const useLocations = (search?: string, page = 1, limit = 50) =>
  useQuery({
    queryKey: ['locations', search, page, limit],
    queryFn: async (): Promise<string[]> => {
      const res = await api.get<any>('/lookups/locations', {
        activeOnly: true,
        limit,
        page,
        ...(search ? { search } : {}),
      });
      const items = Array.isArray(res) ? res : res?.data || [];
      return items.map((item: any) => typeof item === 'string' ? item : item.name || item.location || '');
    },
    staleTime: 5 * 60 * 1000,
  });

export const useInfiniteLocations = (search?: string, limit = 50) =>
  useInfiniteQuery({
    queryKey: ['locationsInfinite', search, limit],
    queryFn: async ({ pageParam = 1 }): Promise<{ items: string[]; hasMore: boolean; nextPage: number }> => {
      const res = await api.get<any>('/lookups/locations', {
        activeOnly: true,
        limit,
        page: pageParam,
        ...(search ? { search } : {}),
      });
      const items = Array.isArray(res) ? res : res?.data || [];
      const mappedItems = items.map((item: any) => typeof item === 'string' ? item : item.label || item.name || '');
      
      const total = res?.meta?.total ?? res?.total ?? 0;
      const hasMore = Array.isArray(res) ? false : (pageParam * limit < total);

      return {
        items: mappedItems,
        hasMore,
        nextPage: pageParam + 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
    staleTime: 5 * 60 * 1000,
  });

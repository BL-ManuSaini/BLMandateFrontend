import { useQuery } from '@tanstack/react-query';
import { api } from '../client';

export const useTechStacks = (search?: string) =>
  useQuery({
    queryKey: ['techStacks', search],
    queryFn: async (): Promise<string[]> => {
      try {
        const res = await api.get<any>('/lookups/tech-stacks', {
          activeOnly: true,
          limit: 10,
          ...(search ? { search } : {}),
        });
        const items = Array.isArray(res) ? res : res?.data || [];
        if (items.length > 0) {
          return items.map((item: any) => typeof item === 'string' ? item : item.name || '');
        }
      } catch (err) {
        console.warn('Failed to fetch tech stacks lookup', err);
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });

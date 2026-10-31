import type { ApiUser } from '../client/types';
import type { User } from '../../types';

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function mapUserFromApi(dto: ApiUser): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    status: dto.status,
    coeScopeIds: dto.coeScopeIds ?? [],
    avatar: getInitials(dto.name),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

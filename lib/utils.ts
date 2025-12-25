import { Server, SortOrder } from '@/types';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDaysUntilExpiry = (expiryDate: string): number => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (expiryDate: string, threshold: number = 7): boolean => {
  const days = getDaysUntilExpiry(expiryDate);
  return days <= threshold && days >= 0;
};

export const isExpired = (expiryDate: string): boolean => {
  return getDaysUntilExpiry(expiryDate) < 0;
};

export const sortServers = (servers: Server[], order: SortOrder): Server[] => {
  const sorted = [...servers];

  switch (order) {
    case 'expiry-asc':
      return sorted.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    case 'expiry-desc':
      return sorted.sort((a, b) => new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime());
    case 'name-asc':
      return sorted.sort((a, b) => a.nickname.localeCompare(b.nickname));
    case 'name-desc':
      return sorted.sort((a, b) => b.nickname.localeCompare(a.nickname));
    case 'created-asc':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'created-desc':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    default:
      return sorted;
  }
};

export const formatUptime = (days: number): string => {
  if (days < 1) {
    const hours = Math.floor(days * 24);
    return `${hours}h`;
  } else if (days < 30) {
    return `${Math.floor(days)}d`;
  } else {
    const months = Math.floor(days / 30);
    const remainingDays = Math.floor(days % 30);
    return remainingDays > 0 ? `${months}mo ${remainingDays}d` : `${months}mo`;
  }
};

export const validateIP = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) return false;

  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

export const getStatusColor = (expiryDate: string): string => {
  if (isExpired(expiryDate)) return 'text-danger';
  if (isExpiringSoon(expiryDate)) return 'text-warning';
  return 'text-success';
};

export const getStatusBorderColor = (expiryDate: string): string => {
  if (isExpired(expiryDate)) return 'border-danger';
  if (isExpiringSoon(expiryDate)) return 'border-warning';
  return 'border-border';
};

export interface ServerStats {
  cpu: number;
  ram: number;
  ramUsed?: number;
  ramTotal?: number;
  disk: number;
  diskUsed?: string;
  diskTotal?: string;
  uptime: number;
  networkRx?: string;
  networkTx?: string;
  networkRxSpeed?: string;
  networkTxSpeed?: string;
  cpuCores?: number;
  loadAverage?: string;
  lastUpdated: number;
}

export interface Server {
  id: string;
  nickname: string;
  ipAddress: string;
  username: string;
  password: string;
  port: number;
  expiryDate: string;
  hostingProvider: string;
  monthlyCost?: number;
  renewalPeriod?: 'off' | 'monthly' | 'yearly' | 'custom';
  renewalDays?: number;
  stats: ServerStats;
  createdAt: number;
}

export type SortOrder = 'expiry-asc' | 'expiry-desc' | 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc';

export interface ServerFormData {
  nickname: string;
  ipAddress: string;
  username: string;
  password: string;
  port: number;
  expiryDate: string;
  hostingProvider: string;
  monthlyCost?: number;
  renewalPeriod?: 'off' | 'monthly' | 'yearly' | 'custom';
  renewalDays?: number;
}

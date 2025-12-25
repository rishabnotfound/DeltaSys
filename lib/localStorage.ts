import { Server, ServerStats } from '@/types';
import { project_name } from '../config.js';

const STORAGE_KEY = `${project_name.toLowerCase()}_servers`;

export const storage = {
  getServers: (): Server[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveServers: (servers: Server[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  addServer: (server: Omit<Server, 'id' | 'createdAt' | 'stats'>): Server => {
    const servers = storage.getServers();
    const newServer: Server = {
      ...server,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      stats: generateInitialStats(),
    };
    servers.push(newServer);
    storage.saveServers(servers);
    return newServer;
  },

  updateServer: (id: string, updates: Partial<Server>): Server | null => {
    const servers = storage.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) return null;

    servers[index] = { ...servers[index], ...updates };
    storage.saveServers(servers);
    return servers[index];
  },

  deleteServer: (id: string): boolean => {
    const servers = storage.getServers();
    const filtered = servers.filter(s => s.id !== id);
    if (filtered.length === servers.length) return false;
    storage.saveServers(filtered);
    return true;
  },

  updateServerStats: (id: string, stats: Partial<ServerStats>): Server | null => {
    const servers = storage.getServers();
    const index = servers.findIndex(s => s.id === id);
    if (index === -1) return null;

    servers[index].stats = {
      ...servers[index].stats,
      ...stats,
      lastUpdated: Date.now(),
    };
    storage.saveServers(servers);
    return servers[index];
  },
};

export const generateInitialStats = (): ServerStats => ({
  cpu: Math.floor(Math.random() * 30) + 10,
  ram: Math.floor(Math.random() * 40) + 20,
  disk: Math.floor(Math.random() * 50) + 30,
  uptime: Math.floor(Math.random() * 30) + 1,
  lastUpdated: Date.now(),
});

export const simulateStatsUpdate = (currentStats: ServerStats): ServerStats => {
  return {
    cpu: Math.max(5, Math.min(100, currentStats.cpu + (Math.random() - 0.5) * 10)),
    ram: Math.max(10, Math.min(95, currentStats.ram + (Math.random() - 0.5) * 8)),
    disk: Math.max(20, Math.min(98, currentStats.disk + (Math.random() - 0.5) * 2)),
    uptime: currentStats.uptime + (1 / 1440),
    lastUpdated: Date.now(),
  };
};

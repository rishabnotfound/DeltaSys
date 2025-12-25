'use client';

import { Server } from '@/types';
import { formatUptime } from '@/lib/utils';
import CircularProgress from './CircularProgress';

interface DetailedStatsViewProps {
  server: Server;
  onClose: () => void;
}

export default function DetailedStatsView({ server, onClose }: DetailedStatsViewProps) {
  const getHealthStatus = () => {
    const avgUsage = (server.stats.cpu + server.stats.ram + server.stats.disk) / 3;
    if (avgUsage < 60) return { status: 'Healthy', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (avgUsage < 80) return { status: 'Moderate', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { status: 'Critical', color: 'text-red-500', bg: 'bg-red-500/20' };
  };

  const health = getHealthStatus();

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{server.nickname}</h2>
              <p className="text-sm text-gray-400">{server.ipAddress}</p>
            </div>
            <div className={`px-3 py-1 rounded-full ${health.bg}`}>
              <span className={`text-sm font-semibold ${health.color}`}>{health.status}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-border rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* System Overview */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background/50 border border-border rounded-lg p-4 flex flex-col items-center">
                <CircularProgress value={server.stats.cpu} size={100} strokeWidth={8} />
                <p className="text-sm text-gray-400 mt-3">CPU Usage</p>
                <p className="text-xl font-bold text-white mt-1">{server.stats.cpu.toFixed(1)}%</p>
                {server.stats.cpuCores && (
                  <p className="text-xs text-gray-500 mt-1">{server.stats.cpuCores} Cores</p>
                )}
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 flex flex-col items-center">
                <CircularProgress value={server.stats.ram} size={100} strokeWidth={8} />
                <p className="text-sm text-gray-400 mt-3">RAM Usage</p>
                <p className="text-xl font-bold text-white mt-1">{server.stats.ram.toFixed(1)}%</p>
                {server.stats.ramTotal && server.stats.ramUsed !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">{server.stats.ramUsed}GB / {server.stats.ramTotal}GB</p>
                )}
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 flex flex-col items-center">
                <CircularProgress value={server.stats.disk} size={100} strokeWidth={8} />
                <p className="text-sm text-gray-400 mt-3">Disk Usage</p>
                <p className="text-xl font-bold text-white mt-1">{server.stats.disk.toFixed(1)}%</p>
                {server.stats.diskTotal && server.stats.diskUsed && (
                  <p className="text-xs text-gray-500 mt-1">{server.stats.diskUsed} / {server.stats.diskTotal}</p>
                )}
              </div>
            </div>
          </div>

          {/* Network Stats */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Network Traffic</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Total Inbound (RX)</p>
                    <p className="text-2xl font-bold text-white">{server.stats.networkRx || '0 GB'}</p>
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400">Total Outbound (TX)</p>
                    <p className="text-2xl font-bold text-white">{server.stats.networkTx || '0 GB'}</p>
                  </div>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>

            {/* Real-time Speed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <p className="text-sm font-medium text-green-400">Download Speed</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{server.stats.networkRxSpeed || '0 KB/s'}</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm font-medium text-blue-400">Upload Speed</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{server.stats.networkTxSpeed || '0 KB/s'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background/50 border border-border rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Uptime</p>
                <p className="text-lg font-semibold text-white">{formatUptime(server.stats.uptime)}</p>
              </div>

              {server.stats.loadAverage && (
                <div className="bg-background/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Load Average</p>
                  <p className="text-lg font-semibold text-white">{server.stats.loadAverage}</p>
                </div>
              )}

              <div className="bg-background/50 border border-border rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Hosting Provider</p>
                <p className="text-lg font-semibold text-white">{server.hostingProvider}</p>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">SSH Port</p>
                <p className="text-lg font-semibold text-white">{server.port}</p>
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Last Updated</p>
                <p className="text-lg font-semibold text-white">
                  {new Date(server.stats.lastUpdated).toLocaleTimeString()}
                </p>
              </div>

              {server.stats.cpuCores && (
                <div className="bg-background/50 border border-border rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">CPU Cores</p>
                  <p className="text-lg font-semibold text-white">{server.stats.cpuCores} Cores</p>
                </div>
              )}
            </div>
          </div>

          {/* Resource Usage Graph */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Resource Usage</h3>
            <div className="bg-background/50 border border-border rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">CPU</span>
                    <span className="text-sm font-bold text-white">{server.stats.cpu.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        server.stats.cpu < 75 ? 'bg-green-500' : server.stats.cpu < 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${server.stats.cpu}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">RAM</span>
                    <span className="text-sm font-bold text-white">{server.stats.ram.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        server.stats.ram < 75 ? 'bg-green-500' : server.stats.ram < 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${server.stats.ram}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-400">Disk</span>
                    <span className="text-sm font-bold text-white">{server.stats.disk.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        server.stats.disk < 75 ? 'bg-green-500' : server.stats.disk < 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${server.stats.disk}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

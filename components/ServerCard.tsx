'use client';

import { Server } from '@/types';
import { formatDate, getDaysUntilExpiry, getStatusColor, getStatusBorderColor, formatUptime } from '@/lib/utils';
import CircularProgress from './CircularProgress';
import ConfirmationDialog from './ConfirmationDialog';
import { useState } from 'react';

interface ServerCardProps {
  server: Server;
  onEdit: (server: Server) => void;
  onDelete: (id: string) => void;
  onUpdateStats: (id: string) => void;
  onOpenManager: (server: Server) => void;
  onOpenDetails: (server: Server) => void;
  isLoading?: boolean;
}

export default function ServerCard({ server, onEdit, onDelete, onUpdateStats, onOpenManager, onOpenDetails, isLoading = false }: ServerCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const daysUntilExpiry = getDaysUntilExpiry(server.expiryDate);
  const statusColor = getStatusColor(server.expiryDate);
  const borderColor = getStatusBorderColor(server.expiryDate);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(server.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
    <div className={`bg-card border-2 ${borderColor} rounded-xl p-4 hover:border-accent/50 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{server.nickname}</h3>
          <button
            onClick={() => copyToClipboard(server.ipAddress)}
            className="text-xs text-gray-400 hover:text-accent transition-colors"
            title="Click to copy"
          >
            {server.ipAddress}
          </button>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onOpenDetails(server)}
            className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
            title="Detailed Stats"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={() => onOpenManager(server)}
            className="p-1.5 hover:bg-accent/20 rounded-lg transition-colors"
            title="Manager"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onEdit(server)}
            className="p-1.5 hover:bg-border rounded-lg transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-1.5 hover:bg-danger/10 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compact Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-gray-500 mb-0.5">Provider</p>
          <p className="text-white font-medium truncate">{server.hostingProvider}</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-gray-500 mb-0.5">Expiry</p>
          <p className={`font-bold ${statusColor}`}>
            {daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry}d`}
          </p>
        </div>
      </div>

      {/* Stats Grid with Circular Progress */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="flex flex-col items-center bg-background/50 rounded-lg p-2">
          <CircularProgress value={server.stats.cpu} size={56} strokeWidth={5} />
          <p className="text-xs text-gray-400 mt-1">CPU</p>
        </div>
        <div className="flex flex-col items-center bg-background/50 rounded-lg p-2">
          <CircularProgress value={server.stats.ram} size={56} strokeWidth={5} />
          <p className="text-xs text-gray-400 mt-1">RAM</p>
          {server.stats.ramTotal && server.stats.ramUsed !== undefined && (
            <p className="text-[10px] text-gray-500">{server.stats.ramUsed}GB/{server.stats.ramTotal}GB</p>
          )}
        </div>
        <div className="flex flex-col items-center bg-background/50 rounded-lg p-2">
          <CircularProgress value={server.stats.disk} size={56} strokeWidth={5} />
          <p className="text-xs text-gray-400 mt-1">Disk</p>
          {server.stats.diskTotal && server.stats.diskUsed && (
            <p className="text-[10px] text-gray-500">{server.stats.diskUsed}/{server.stats.diskTotal}</p>
          )}
        </div>
      </div>

      {/* Uptime & Password */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-gray-500 mb-0.5">Uptime</p>
          <p className="text-white font-medium">{formatUptime(server.stats.uptime)}</p>
        </div>
        <div className="bg-background/50 rounded-lg p-2">
          <p className="text-gray-500 mb-0.5">Password</p>
          <div className="flex items-center gap-1">
            <p className="text-white font-medium text-[10px] truncate flex-1">
              {showPassword ? server.password : '••••••••'}
            </p>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Update Button */}
      <button
        onClick={() => onUpdateStats(server.id)}
        disabled={isLoading}
        className="w-full py-1.5 px-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Fetching...
          </>
        ) : (
          'Update Stats'
        )}
      </button>
    </div>

    {showDeleteDialog && (
      <ConfirmationDialog
        title="Delete Server"
        message={`Are you sure you want to delete "${server.nickname}"? This action cannot be undone.`}
        confirmText="Delete"
        requiredInput={server.ipAddress}
        inputPlaceholder="Enter server IP address"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
        isDangerous={true}
      />
    )}
    </>
  );
}

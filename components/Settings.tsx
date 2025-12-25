'use client';

import { storage } from '@/lib/localStorage';
import ConfirmationDialog from './ConfirmationDialog';
import Notification from './Notification';
import { useState, useRef } from 'react';
import { project_name } from '../config.js';

interface SettingsProps {
  onClose: () => void;
  onDataChange: () => void;
}

export default function Settings({ onClose, onDataChange }: SettingsProps) {
  const [importing, setImporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const servers = storage.getServers();
    const dataStr = JSON.stringify(servers, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project_name.toLowerCase()}-servers-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotification({ message: 'Servers exported successfully!', type: 'success' });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Check if it's a backup file with version info
      const servers = data.version ? data.servers : data;

      if (!Array.isArray(servers)) {
        setNotification({ message: 'Invalid file format. Please select a valid JSON file.', type: 'error' });
        setImporting(false);
        return;
      }

      // Validate server structure
      const isValid = servers.every(s =>
        s.nickname && s.ipAddress && s.username && s.password
      );

      if (!isValid) {
        setNotification({ message: 'Invalid server data structure in the file.', type: 'error' });
        setImporting(false);
        return;
      }

      // Import servers - replace current data
      storage.saveServers(servers);
      setNotification({ message: `Successfully imported ${servers.length} server(s)!`, type: 'success' });

      setTimeout(() => {
        onDataChange();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      setNotification({ message: 'Failed to import file. Please check the file format.', type: 'error' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    setShowClearDialog(true);
  };

  const handleClearConfirm = () => {
    storage.saveServers([]);
    setNotification({ message: 'All data has been cleared.', type: 'success' });

    setTimeout(() => {
      onDataChange();
      onClose();
    }, 1500);
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Data Management</h3>
            <div className="space-y-3">
              {/* Export */}
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 p-4 bg-background/50 hover:bg-background border border-border rounded-lg transition-colors group"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">Export Servers</p>
                  <p className="text-xs text-gray-500">Download servers as JSON</p>
                </div>
              </button>

              {/* Import */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="w-full flex items-center gap-3 p-4 bg-background/50 hover:bg-background border border-border rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">
                    {importing ? 'Importing...' : 'Import Servers'}
                  </p>
                  <p className="text-xs text-gray-500">Upload JSON file</p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Danger Zone</h3>
            <button
              onClick={handleClearData}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors group"
            >
              <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-red-500 font-medium">Clear All Data</p>
                <p className="text-xs text-red-400/70">Permanently delete all servers</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    {showClearDialog && (
      <ConfirmationDialog
        title="Clear All Data"
        message="This will permanently delete ALL servers and their data. This action cannot be undone."
        confirmText="Delete Everything"
        requiredInput="DELETE IT"
        inputPlaceholder='Type "DELETE IT" to confirm'
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearDialog(false)}
        isDangerous={true}
      />
    )}

    {notification && (
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(null)}
      />
    )}
    </>
  );
}

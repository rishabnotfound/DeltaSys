'use client';

import { Server } from '@/types';
import FileExplorer from './FileExplorer';
import Terminal from './Terminal';
import { useState } from 'react';

interface ServerManagerProps {
  server: Server;
  onClose: () => void;
}

export default function ServerManager({ server, onClose }: ServerManagerProps) {
  const [explorerWidth, setExplorerWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/root');

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;

    if (newWidth > 20 && newWidth < 80) {
      setExplorerWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{server.nickname}</h2>
            <p className="text-sm text-gray-400">{server.ipAddress}</p>
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

        {/* Split view */}
        <div
          className="flex-1 flex overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* File Explorer */}
          <div
            className="border-r border-border overflow-hidden"
            style={{ width: `${explorerWidth}%` }}
          >
            <FileExplorer
              server={server}
              externalPath={currentDirectory}
              onPathChange={setCurrentDirectory}
            />
          </div>

          {/* Resizer */}
          <div
            className="w-1 bg-border hover:bg-accent cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
          />

          {/* Terminal */}
          <div
            className="overflow-hidden"
            style={{ width: `${250 - explorerWidth}%` }}
          >
            <Terminal
              server={server}
              onDirectoryChange={setCurrentDirectory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

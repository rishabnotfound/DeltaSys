'use client';

import { Server } from '@/types';
import FileExplorer from './FileExplorer';
import Terminal from './Terminal';
import FileEditor from './FileEditor';
import MediaViewer from './MediaViewer';
import { useState, useEffect } from 'react';

interface ServerManagerProps {
  server: Server;
  onClose: () => void;
}

export default function ServerManager({ server, onClose }: ServerManagerProps) {
  const [explorerWidth, setExplorerWidth] = useState(25); // Reduced to 25% for more terminal space
  const [isDragging, setIsDragging] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('/root');
  const [showExplorer, setShowExplorer] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [viewingMedia, setViewingMedia] = useState<{ path: string; type: 'image' } | null>(null);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          <div className="flex items-center gap-3">
            {/* Explorer Toggle - visible on all screen sizes */}
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className="p-2 hover:bg-border rounded-lg transition-colors"
              title={showExplorer ? "Hide Explorer" : "Show Explorer"}
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showExplorer ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                )}
              </svg>
            </button>
            <div>
              <h2 className="text-xl font-bold text-white">{server.nickname}</h2>
              <p className="text-sm text-gray-400">{server.ipAddress}</p>
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

        {/* Split view */}
        <div
          className="flex-1 flex overflow-hidden relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* File Explorer - overlay on mobile, hidden/visible on desktop */}
          <div
            className={`
              border-r border-border overflow-hidden bg-card
              transition-all duration-300
              ${isMobile ? 'absolute inset-y-0 left-0 z-10' : 'relative'}
              ${!showExplorer && isMobile ? '-translate-x-full' : 'translate-x-0'}
            `}
            style={{
              width: isMobile
                ? (showExplorer ? '85%' : '0%')
                : (showExplorer ? `${explorerWidth}%` : '0%')
            }}
          >
            {showExplorer && (
              <FileExplorer
                server={server}
                externalPath={currentDirectory}
                onPathChange={setCurrentDirectory}
                onEditFile={(path, content) => setEditingFile({ path, content })}
                onViewMedia={(path) => setViewingMedia({ path, type: 'image' })}
              />
            )}
          </div>

          {/* Resizer - only visible on desktop when explorer is shown */}
          {!isMobile && showExplorer && (
            <div
              className="w-1 bg-border hover:bg-accent cursor-col-resize transition-colors"
              onMouseDown={handleMouseDown}
            />
          )}

          {/* Terminal */}
          <div
            className="overflow-hidden flex-1"
            style={{
              width: isMobile
                ? '100%'
                : (showExplorer ? `${100 - explorerWidth}%` : '100%')
            }}
          >
            <Terminal
              server={server}
              onDirectoryChange={setCurrentDirectory}
            />
          </div>

          {/* Mobile overlay backdrop */}
          {isMobile && showExplorer && (
            <div
              className="absolute inset-0 bg-black/50 z-[9]"
              onClick={() => setShowExplorer(false)}
            />
          )}
        </div>
      </div>

      {/* File Editor Modal - rendered at root level to avoid overflow clipping */}
      {editingFile && (
        <FileEditor
          server={server}
          filePath={editingFile.path}
          initialContent={editingFile.content}
          onClose={() => setEditingFile(null)}
          onSave={() => {
            // Optionally refresh the directory after save
            // Could trigger a refresh in FileExplorer if needed
          }}
        />
      )}

      {/* Media Viewer Modal - rendered at root level to avoid overflow clipping */}
      {viewingMedia && (
        <MediaViewer
          server={server}
          filePath={viewingMedia.path}
          fileType={viewingMedia.type}
          onClose={() => setViewingMedia(null)}
        />
      )}
    </div>
  );
}

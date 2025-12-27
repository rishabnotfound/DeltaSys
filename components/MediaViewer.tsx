'use client';

import { useState, useEffect } from 'react';
import { Server } from '@/types';

interface MediaViewerProps {
  server: Server;
  filePath: string;
  fileType: 'image'; // Only images allowed (max 100KB)
  onClose: () => void;
}

export default function MediaViewer({ server, filePath, fileType, onClose }: MediaViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  // Pan and zoom state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchMedia();
    return () => {
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [filePath]);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'download',
          path: filePath,
        }),
      });

      const data = await response.json();
      if (data.success && data.content) {
        // Convert base64 to blob URL
        const byteCharacters = atob(data.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        // Determine MIME type from file extension (images only)
        const extension = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'svg': 'image/svg+xml',
          'bmp': 'image/bmp',
          'ico': 'image/x-icon',
        };

        const mimeType = mimeTypes[extension || ''] || 'image/jpeg';
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);

        setMediaUrl(url);
      } else {
        setError(data.error || 'Failed to load media');
      }
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setError('Failed to load media file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!mediaUrl) return;
    const fileName = filePath.split('/').pop() || 'download';
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pan and zoom handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.min(Math.max(0.5, prev * delta), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card/60 via-card/80 to-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{fileName}</h2>
              <p className="text-xs text-gray-400 font-mono">{filePath}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mediaUrl && (
              <>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 bg-border hover:bg-border/80 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                  title="Reset view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-border rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div
          className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 p-4"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-white text-lg font-medium">Loading media...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-red-500/20 rounded-full">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-500 text-lg font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && mediaUrl && (
            <img
              src={mediaUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain rounded-lg select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* Footer - Info */}
        {!loading && !error && (
          <div className="px-4 py-2 border-t border-border bg-background/50 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="text-accent">Image Preview</span>
              <span>{fileName.split('.').pop()?.toUpperCase()}</span>
              <span className="text-gray-500">Max 100KB</span>
              <span className="text-accent">Zoom: {Math.round(scale * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Click and drag to pan • Scroll to zoom (50%-500%)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

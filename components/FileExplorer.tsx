'use client';

import { useState, useEffect } from 'react';
import { Server } from '@/types';
import FileEditor from './FileEditor';
import MediaViewer from './MediaViewer';
import Notification from './Notification';

interface FileItem {
  name: string;
  isDirectory: boolean;
  permissions: string;
  size: string;
  modified: string;
}

interface FileExplorerProps {
  server: Server;
  externalPath?: string;
  onPathChange?: (path: string) => void;
}

export default function FileExplorer({ server, externalPath, onPathChange }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState('/root');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [viewingMedia, setViewingMedia] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ path: string; name: string } | null>(null);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string } | null>(null);
  const [operationInProgress, setOperationInProgress] = useState(false);

  // Sort files by hierarchy: hidden files first, then folders (A-Z), then files (A-Z)
  const sortFiles = (fileList: FileItem[]): FileItem[] => {
    return [...fileList].sort((a, b) => {
      const aIsHidden = a.name.startsWith('.');
      const bIsHidden = b.name.startsWith('.');

      // Hidden files come first
      if (aIsHidden && !bIsHidden) return -1;
      if (!aIsHidden && bIsHidden) return 1;

      // Within same hidden status, directories come before files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;

      // Within same type, sort alphabetically (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'list',
          path,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setFiles(sortFiles(data.files));
        setCurrentPath(path);
        // Notify parent of path change
        if (onPathChange) {
          onPathChange(path);
        }
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
    setLoading(false);
    setOperationInProgress(false);
  };

  const readFile = async (path: string) => {
    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'read',
          path,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingFile({ path, content: data.content });
      } else {
        setNotification({ message: `Failed to read file: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      setNotification({ message: 'Failed to read file', type: 'error' });
    }
    setOperationInProgress(false);
  };


  const deleteItem = async (path: string) => {
    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'delete',
          path,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ message: 'File deleted successfully!', type: 'success' });
        await loadDirectory(currentPath);
      } else {
        setNotification({ message: `Failed to delete: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      setNotification({ message: 'Failed to delete file', type: 'error' });
    }
    setOperationInProgress(false);
  };

  const handleDeleteClick = (path: string, name: string) => {
    setDeleteTarget({ path, name });
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteItem(deleteTarget.path);
      setDeleteTarget(null);
    }
  };

  const createNewFile = async () => {
    if (!newItemName.trim()) {
      setNotification({ message: 'File name cannot be empty', type: 'error' });
      return;
    }

    const fullPath = `${currentPath}/${newItemName}`.replace('//', '/');

    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'write',
          path: fullPath,
          content: '',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ message: 'File created successfully!', type: 'success' });
        await loadDirectory(currentPath);
        setShowNewFileModal(false);
        setNewItemName('');
      } else {
        setNotification({ message: `Failed to create file: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create file:', error);
      setNotification({ message: 'Failed to create file', type: 'error' });
    }
    setOperationInProgress(false);
  };

  const createNewFolder = async () => {
    if (!newItemName.trim()) {
      setNotification({ message: 'Folder name cannot be empty', type: 'error' });
      return;
    }

    const fullPath = `${currentPath}/${newItemName}`.replace('//', '/');

    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'mkdir',
          path: fullPath,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ message: 'Folder created successfully!', type: 'success' });
        await loadDirectory(currentPath);
        setShowNewFolderModal(false);
        setNewItemName('');
      } else {
        setNotification({ message: `Failed to create folder: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      setNotification({ message: 'Failed to create folder', type: 'error' });
    }
    setOperationInProgress(false);
  };

  const handleRenameClick = (path: string) => {
    const name = path.split('/').pop() || '';
    setRenameTarget({ path, name });
    setNewItemName(name);
    setShowRenameModal(true);
  };

  const renameItem = async () => {
    if (!renameTarget || !newItemName.trim()) {
      setNotification({ message: 'Name cannot be empty', type: 'error' });
      return;
    }

    if (newItemName === renameTarget.name) {
      setShowRenameModal(false);
      setNewItemName('');
      setRenameTarget(null);
      return;
    }

    const parentDir = renameTarget.path.substring(0, renameTarget.path.lastIndexOf('/'));
    const newPath = `${parentDir}/${newItemName}`;

    setOperationInProgress(true);
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'rename',
          path: renameTarget.path,
          newPath: newPath,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNotification({ message: 'Renamed successfully!', type: 'success' });
        await loadDirectory(currentPath);
        setShowRenameModal(false);
        setNewItemName('');
        setRenameTarget(null);
      } else {
        setNotification({ message: `Failed to rename: ${data.error}`, type: 'error' });
      }
    } catch (error) {
      console.error('Failed to rename:', error);
      setNotification({ message: 'Failed to rename', type: 'error' });
    }
    setOperationInProgress(false);
  };

  useEffect(() => {
    loadDirectory(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with external path changes (from Terminal cd commands)
  useEffect(() => {
    if (externalPath && externalPath !== currentPath) {
      loadDirectory(externalPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPath]);

  const isImageFile = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext || '');
  };

  const isVideoFile = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext || '');
  };

  const handleFileClick = (file: FileItem) => {
    const fullPath = `${currentPath}/${file.name}`.replace('//', '/');

    if (file.isDirectory) {
      loadDirectory(fullPath);
      return;
    }

    // Parse file size (can be in B, K, M, G format)
    const parseFileSize = (sizeStr: string): number => {
      const match = sizeStr.match(/^([\d.]+)([BKMG]?)$/i);
      if (!match) return 0;

      const value = parseFloat(match[1]);
      const unit = match[2].toUpperCase();

      const multipliers: { [key: string]: number } = {
        'B': 1,
        'K': 1024,
        'M': 1024 * 1024,
        'G': 1024 * 1024 * 1024,
        '': 1, // bytes
      };

      return value * (multipliers[unit] || 1);
    };

    const fileSizeBytes = parseFileSize(file.size);
    const maxPreviewSize = 100 * 1024; // 100KB

    // Block video previews entirely
    if (isVideoFile(file.name)) {
      setNotification({
        message: 'Video preview not supported. Videos cannot be previewed due to size limitations.',
        type: 'error'
      });
      return;
    }

    // Check file size for image preview
    if (isImageFile(file.name)) {
      if (fileSizeBytes > maxPreviewSize) {
        const fileSizeKB = Math.round(fileSizeBytes / 1024);
        setNotification({
          message: `Image too large to preview: ${fileSizeKB}KB. Maximum: 100KB`,
          type: 'error'
        });
        return;
      }
      setViewingMedia(fullPath);
      return;
    }

    // Text/code files - also check size
    if (fileSizeBytes > maxPreviewSize) {
      const fileSizeKB = Math.round(fileSizeBytes / 1024);
      setNotification({
        message: `File too large to preview: ${fileSizeKB}KB. Maximum: 100KB`,
        type: 'error'
      });
      return;
    }

    readFile(fullPath);
  };

  const goUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const isAllowedFileType = (filename: string): boolean => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    // Allowed: images and common code/text files
    const allowedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
      'avif', 'heic', 'heif', 'tiff', 'tif',
      // Code / Text
      'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
      'json', 'html', 'css', 'scss', 'sass',
      'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
      'php', 'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
      'yaml', 'yml', 'xml', 'toml', 'ini',
      'md', 'txt', 'log', 'env', 'conf', 'config',
      'sql', 'graphql', 'proto',
      'vue', 'svelte', 'astro'
    ];
    return allowedExtensions.includes(ext);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    // STRICT UPLOAD RULES
    const maxFileSize = 100 * 1024; // 100KB limit (base64 encoding limitation)
    const maxFiles = 1; // Only 1 file at a time

    // Rule 1: Only 1 file at a time
    if (droppedFiles.length > maxFiles) {
      setNotification({
        message: `Upload 1 file at a time only. You tried to upload ${droppedFiles.length} files.`,
        type: 'error'
      });
      return;
    }

    const file = droppedFiles[0];

    // Rule 2 & 3: 100KB limit, no videos
    if (file.size > maxFileSize) {
      const fileSizeKB = Math.round(file.size / 1024);
      setNotification({
        message: `File too large: ${fileSizeKB}KB. Maximum: 100KB`,
        type: 'error'
      });
      return;
    }

    // Rule 3: No videos allowed
    if (isVideoFile(file.name)) {
      setNotification({
        message: 'Video uploads not allowed. Only images and code files under 100KB.',
        type: 'error'
      });
      return;
    }

    // Rule 4: Only allowed file types (images and code)
    if (!isAllowedFileType(file.name)) {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown';
      setNotification({
        message: `File type .${ext} not allowed. Only images and code files supported.`,
        type: 'error'
      });
      return;
    }

    setUploading(true);
    setOperationInProgress(true);

    try {
      await uploadFile(file);
      await loadDirectory(currentPath);
      setNotification({
        message: `Successfully uploaded ${file.name}!`,
        type: 'success'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setNotification({ message: 'Failed to upload file', type: 'error' });
    } finally {
      setUploading(false);
      setOperationInProgress(false);
    }
  };

  const uploadFile = async (file: File): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Read file as base64
        const reader = new FileReader();

        reader.onload = async () => {
          const base64Content = reader.result as string;
          const content = base64Content.split(',')[1]; // Remove data URL prefix

          const fullPath = `${currentPath}/${file.name}`.replace('//', '/');

          try {
            const response = await fetch('/api/files', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ipAddress: server.ipAddress,
                username: server.username,
                password: server.password,
                port: server.port,
                action: 'upload',
                path: fullPath,
                content: content,
                encoding: 'base64',
              }),
            });

            const data = await response.json();
            if (data.success) {
              resolve();
            } else {
              reject(new Error(data.error || 'Upload failed'));
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <>
    <div className="h-full flex flex-col bg-background">
      {/* Loading Progress Bar */}
      {operationInProgress && (
        <div className="w-full h-1 bg-background overflow-hidden">
          <div className="h-full bg-accent animate-progress-bar"></div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-2 border-b border-border flex items-center gap-2 flex-wrap">
            <button
              onClick={goUp}
              disabled={currentPath === '/'}
              className="p-1.5 hover:bg-border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Go up"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>

            <button
              onClick={() => loadDirectory(currentPath)}
              className="p-1.5 hover:bg-border rounded"
              title="Refresh"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => setShowNewFileModal(true)}
              className="px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 text-accent rounded flex items-center gap-1"
              title="New File"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              File
            </button>

            <button
              onClick={() => setShowNewFolderModal(true)}
              className="px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 text-accent rounded flex items-center gap-1"
              title="New Folder"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Folder
            </button>

            <span className="flex-1 text-xs text-gray-400 font-mono ml-2 truncate">{currentPath}</span>
          </div>

          <div
            className="flex-1 overflow-y-auto relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-accent/20 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-accent pointer-events-none">
                <div className="bg-card/90 rounded-xl p-6 border border-accent shadow-2xl">
                  <svg className="w-16 h-16 text-accent mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-white text-lg font-bold text-center">Drop file here to upload</p>
                  <p className="text-gray-400 text-sm text-center mt-2">1 file at a time, max 100KB</p>
                  <p className="text-gray-500 text-xs text-center mt-1">Images & code only • No videos</p>
                </div>
              </div>
            )}

            {/* Upload progress indicator */}
            {uploading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card rounded-xl p-6 border border-border shadow-2xl">
                  <svg className="animate-spin h-12 w-12 text-accent mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-white text-lg font-bold text-center">Uploading files...</p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">loading...</div>
            ) : (
              <div className="divide-y divide-border">
                {files.map((file, idx) => {
                  const isHidden = file.name.startsWith('.');
                  const isImage = isImageFile(file.name);
                  const isVideo = isVideoFile(file.name);
                  return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 hover:bg-border/50 cursor-pointer group text-sm ${isHidden ? 'opacity-60 hover:opacity-100' : ''}`}
                  >
                    <div className="flex-1 flex items-center gap-2" onClick={() => handleFileClick(file)}>
                      {file.isDirectory ? (
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : isImage ? (
                        <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : isVideo ? (
                        <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-white font-mono text-xs truncate">{file.name}</span>
                      {isHidden && (
                        <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-gray-700/30 rounded">hidden</span>
                      )}
                      {isImage && (
                        <span className="text-xs text-purple-400 px-1.5 py-0.5 bg-purple-500/10 rounded">image</span>
                      )}
                      {isVideo && (
                        <span className="text-xs text-blue-400 px-1.5 py-0.5 bg-blue-500/10 rounded">video</span>
                      )}
                      <span className="text-gray-500 text-xs ml-auto flex-shrink-0">{file.size}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRenameClick(`${currentPath}/${file.name}`.replace('//', '/'));
                        }}
                        className="p-1 hover:bg-accent/20 rounded"
                        title="Rename"
                      >
                        <svg className="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(`${currentPath}/${file.name}`.replace('//', '/'), file.name);
                        }}
                        className="p-1 hover:bg-danger/20 rounded"
                        title="Delete"
                      >
                        <svg className="w-3 h-3 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
    </div>

    {/* File Editor Modal */}
    {editingFile && (
      <FileEditor
        server={server}
        filePath={editingFile.path}
        initialContent={editingFile.content}
        onClose={() => setEditingFile(null)}
        onSave={() => {
          // Optionally refresh the directory after save
          // loadDirectory(currentPath);
        }}
      />
    )}

    {/* Media Viewer Modal */}
    {viewingMedia && (
      <MediaViewer
        server={server}
        filePath={viewingMedia}
        fileType="image"
        onClose={() => setViewingMedia(null)}
      />
    )}

    {/* Delete Confirmation Dialog */}
    {deleteTarget && (
      <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-red-500 mb-4">Delete File</h3>
          <p className="text-white mb-6">
            Are you sure you want to delete <span className="font-bold text-accent">&quot;{deleteTarget.name}&quot;</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-6 py-2 bg-border hover:bg-border/80 text-white rounded-lg transition-colors font-medium"
            >
              No
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    )}

    {/* New File Modal */}
    {showNewFileModal && (
      <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-white mb-4">Create New File</h3>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNewFile()}
            placeholder="Enter file name..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent mb-4"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowNewFileModal(false);
                setNewItemName('');
              }}
              className="px-4 py-2 bg-border hover:bg-border/80 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createNewFile}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* New Folder Modal */}
    {showNewFolderModal && (
      <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-white mb-4">Create New Folder</h3>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createNewFolder()}
            placeholder="Enter folder name..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent mb-4"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowNewFolderModal(false);
                setNewItemName('');
              }}
              className="px-4 py-2 bg-border hover:bg-border/80 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createNewFolder}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Rename Modal */}
    {showRenameModal && renameTarget && (
      <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
          <h3 className="text-xl font-bold text-white mb-4">Rename</h3>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && renameItem()}
            placeholder="Enter new name..."
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent mb-4"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowRenameModal(false);
                setNewItemName('');
                setRenameTarget(null);
              }}
              className="px-4 py-2 bg-border hover:bg-border/80 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={renameItem}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
            >
              Rename
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Notification */}
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

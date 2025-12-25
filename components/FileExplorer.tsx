'use client';

import { useState, useEffect } from 'react';
import { Server } from '@/types';

interface FileItem {
  name: string;
  isDirectory: boolean;
  permissions: string;
  size: string;
  modified: string;
}

interface FileExplorerProps {
  server: Server;
}

export default function FileExplorer({ server }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState('/root');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [editing, setEditing] = useState(false);

  // Modals
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState('');
  const [newName, setNewName] = useState('');

  const loadDirectory = async (path: string) => {
    setLoading(true);
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
        setFiles(data.files);
        setCurrentPath(path);
      }
    } catch (error) {
      console.error('Failed to load directory:', error);
    }
    setLoading(false);
  };

  const readFile = async (path: string) => {
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
        setFileContent(data.content);
        setEditing(true);
      }
    } catch (error) {
      console.error('Failed to read file:', error);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'write',
          path: selectedFile,
          content: fileContent,
        }),
      });
      alert('File saved!');
      setEditing(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file');
    }
  };

  const deleteItem = async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;

    try {
      await fetch('/api/files', {
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
      loadDirectory(currentPath);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const createNewFile = async () => {
    const filename = prompt('Enter file name:');
    if (!filename) return;

    const fullPath = `${currentPath}/${filename}`.replace('//', '/');

    try {
      await fetch('/api/files', {
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
      loadDirectory(currentPath);
      setShowNewFileModal(false);
    } catch (error) {
      console.error('Failed to create file:', error);
      alert('Failed to create file');
    }
  };

  const createNewFolder = async () => {
    const foldername = prompt('Enter folder name:');
    if (!foldername) return;

    const fullPath = `${currentPath}/${foldername}`.replace('//', '/');

    try {
      await fetch('/api/files', {
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
      loadDirectory(currentPath);
      setShowNewFolderModal(false);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  };

  const renameItem = async (oldPath: string) => {
    const oldName = oldPath.split('/').pop() || '';
    const newFileName = prompt('Enter new name:', oldName);
    if (!newFileName || newFileName === oldName) return;

    const parentDir = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = `${parentDir}/${newFileName}`;

    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
          action: 'rename',
          path: oldPath,
          newPath: newPath,
        }),
      });
      loadDirectory(currentPath);
    } catch (error) {
      console.error('Failed to rename:', error);
      alert('Failed to rename');
    }
  };

  useEffect(() => {
    loadDirectory(currentPath);
  }, []);

  const handleFileClick = (file: FileItem) => {
    const fullPath = `${currentPath}/${file.name}`.replace('//', '/');

    if (file.isDirectory) {
      loadDirectory(fullPath);
    } else {
      setSelectedFile(fullPath);
      readFile(fullPath);
    }
  };

  const goUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    loadDirectory(parentPath);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {editing && selectedFile ? (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-gray-400 font-mono">{selectedFile}</span>
            <div className="flex gap-2">
              <button
                onClick={saveFile}
                className="px-3 py-1 bg-accent hover:bg-accent-hover text-white rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setSelectedFile(null);
                }}
                className="px-3 py-1 bg-border hover:bg-border/80 text-white rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            className="flex-1 p-4 bg-card text-white font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>
      ) : (
        <>
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
              onClick={createNewFile}
              className="px-2 py-1 text-xs bg-accent/20 hover:bg-accent/30 text-accent rounded flex items-center gap-1"
              title="New File"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              File
            </button>

            <button
              onClick={createNewFolder}
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

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
            ) : (
              <div className="divide-y divide-border">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-border/50 cursor-pointer group text-sm"
                  >
                    <div className="flex-1 flex items-center gap-2" onClick={() => handleFileClick(file)}>
                      {file.isDirectory ? (
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-white font-mono text-xs truncate">{file.name}</span>
                      <span className="text-gray-500 text-xs ml-auto flex-shrink-0">{file.size}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          renameItem(`${currentPath}/${file.name}`.replace('//', '/'));
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
                          deleteItem(`${currentPath}/${file.name}`.replace('//', '/'));
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
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

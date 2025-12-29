'use client';

import { useState, useEffect } from 'react';
import { Server, SortOrder, ServerFormData } from '@/types';
import { storage } from '@/lib/localStorage';
import { sortServers } from '@/lib/utils';
import { Logo , Plus } from '@/components/Icons';
import ServerCard from '@/components/ServerCard';
import ServerForm from '@/components/ServerForm';
import ServerManager from '@/components/ServerManager';
import DetailedStatsView from '@/components/DetailedStatsView';
import Settings from '@/components/Settings';
import Notification from '@/components/Notification';
import { project_name, github_repo, owner_name } from '../config.js';

export default function Home() {
  const [servers, setServers] = useState<Server[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('expiry-asc');
  const [showForm, setShowForm] = useState(false);
  const [editingServer, setEditingServer] = useState<Server | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());
  const [managerServer, setManagerServer] = useState<Server | undefined>();
  const [detailsServer, setDetailsServer] = useState<Server | undefined>();
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info'; duration?: number } | null>(null);

  useEffect(() => {
    setServers(storage.getServers());
  }, []);

  // Auto-renew expired servers
  useEffect(() => {
    const checkAndRenewServers = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Load fresh data from storage to avoid stale state
      const currentServers = storage.getServers();
      const renewedServersList: string[] = [];
      let hasUpdates = false;

      const updatedServers = currentServers.map(server => {
        if (!server.renewalPeriod || server.renewalPeriod === 'off') return server;

        const expiryDate = new Date(server.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        // If expired and has auto-renewal
        if (expiryDate < today) {
          let renewalDays = 0;
          if (server.renewalPeriod === 'monthly') {
            renewalDays = 30;
          } else if (server.renewalPeriod === 'yearly') {
            renewalDays = 365;
          } else if (server.renewalPeriod === 'custom' && server.renewalDays) {
            renewalDays = server.renewalDays;
          }

          if (renewalDays > 0) {
            // Calculate new expiry date from today, not from old expiry date
            const newExpiryDate = new Date(today);
            newExpiryDate.setDate(newExpiryDate.getDate() + renewalDays);

            const renewedServer = { ...server, expiryDate: newExpiryDate.toISOString().split('T')[0] };
            storage.updateServer(server.id, renewedServer);
            hasUpdates = true;
            renewedServersList.push(`${server.nickname} → ${renewedServer.expiryDate}`);

            return renewedServer;
          }
        }

        return server;
      });

      if (hasUpdates) {
        setServers(updatedServers);

        // Show notification with all renewed servers
        const message = renewedServersList.length === 1
          ? `Auto-renewed: ${renewedServersList[0]}`
          : `Auto-renewed ${renewedServersList.length} servers:\n${renewedServersList.join('\n')}`;

        setNotification({
          message,
          type: 'success',
          duration: 5000 // 5 seconds for renewal notifications
        });
      }
    };

    // Check on mount
    checkAndRenewServers();

    // Check every hour (not just daily, to catch changes faster)
    const interval = setInterval(checkAndRenewServers, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Empty dependency array - only run on mount

  const fetchServerStats = async (server: Server) => {
    try {
      const response = await fetch('/api/server-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: server.ipAddress,
          username: server.username,
          password: server.password,
          port: server.port,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const updated = storage.updateServerStats(server.id, data.stats);
        if (updated) {
          setServers(prev => prev.map(s => s.id === updated.id ? updated : s));
          setDetailsServer(prev => prev?.id === updated.id ? updated : prev);
        }
      } else {
        setNotification({
          message: `Failed to fetch stats for ${server.nickname}: ${data.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error(`Failed to fetch stats for ${server.nickname}:`, error);
      setNotification({
        message: `Network error while fetching stats for ${server.nickname}`,
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      servers.forEach(server => {
        if (!loadingStats.has(server.id)) {
          fetchServerStats(server);
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [servers, loadingStats]);

  const handleAddServer = async (data: ServerFormData) => {
    const newServer = storage.addServer(data);
    setServers([...servers, newServer]);
    setShowForm(false);
    await fetchServerStats(newServer);
  };

  const handleEditServer = (data: ServerFormData) => {
    if (!editingServer) return;
    const updated = storage.updateServer(editingServer.id, data);
    if (updated) {
      setServers(servers.map(s => s.id === updated.id ? updated : s));
    }
    setEditingServer(undefined);
    setShowForm(false);
  };

  const handleDeleteServer = (id: string) => {
    storage.deleteServer(id);
    setServers(servers.filter(s => s.id !== id));
  };

  const handleUpdateStats = async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) return;

    setLoadingStats(prev => new Set(prev).add(id));
    await fetchServerStats(server);
    setLoadingStats(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const openEditForm = (server: Server) => {
    setEditingServer(server);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingServer(undefined);
  };

  const handleDataChange = () => {
    setServers(storage.getServers());
  };

  const handleCopy = (message: string) => {
    setNotification({ message, type: 'success' });
  };

  const filteredServers = servers.filter(server =>
    server.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.ipAddress.includes(searchQuery) ||
    server.hostingProvider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedServers = sortServers(filteredServers, sortOrder);

  // Calculate total cost
  const totalCost = servers.reduce((sum, server) => sum + (server.monthlyCost || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Glassmorphism Navbar */}
      <header className="sticky top-0 z-50 px-4 sm:px-6 lg:px-8 pt-4">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-card/40 via-card/60 to-card/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl shadow-accent/5">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 rounded-full" />

            {/* Content */}
            <div className="relative flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3">
                <div className="rounded-full">
                  <Logo size={40} />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {project_name}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Server Stats */}
                <div className="hidden sm:flex items-center gap-4 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Srv</span>
                    <span className="text-sm font-bold text-white">{servers.length}</span>
                  </div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Cost</span>
                    <span className="text-sm font-bold text-green-400">${totalCost.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(true)}
                  className="group p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                  title="Settings"
                >
                  <svg
  className="
    w-6 h-6 text-gray-300
    transition-transform transition-colors
    duration-700 ease-in-out
    group-hover:text-white
    group-hover:rotate-90
    group-hover:scale-110
  "
  fill="none"
  stroke="currentColor"
  viewBox="0 0 24 24"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
  />
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
</svg>

                </button>

                <button
                  onClick={() => setShowForm(true)}
                  className="group relative px-5 py-2 bg-gradient-to-r from-accent to-accent-hover rounded-full font-medium transition-all duration-300 overflow-hidden "
                >


                  <span className="relative flex items-center gap-2 text-white">
                    <span className="transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110">
                      <Plus size={18} />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-card border border-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
<div className="flex items-center gap-2 min-w-0">

  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
    className="px-4 py-2 bg-card border border-border rounded-lg text-white focus:outline-none focus:border-accent w-full sm:w-auto min-w-0"
  >
    <option value="expiry-asc">Expiry (Soonest)</option>
    <option value="expiry-desc">Expiry (Latest)</option>
    <option value="name-asc">Name (A-Z)</option>
    <option value="name-desc">Name (Z-A)</option>
    <option value="created-desc">Recently Added</option>
    <option value="created-asc">Oldest First</option>
  </select>
</div>


        </div>

        {servers.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-white mt-4 mb-2">No Servers Yet</h2>
            <p className="text-gray-400 mb-6">Get started by adding your first server</p>
            <button
              onClick={() => setShowForm(true)}
              className="mx-auto flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors group"
            >
            <span className="transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:scale-110">
              <Plus size={18} />
            </span>
            Add Your First Server
            </button>
          </div>
        ) : sortedServers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No servers match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedServers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                onEdit={openEditForm}
                onDelete={handleDeleteServer}
                onUpdateStats={handleUpdateStats}
                onOpenManager={setManagerServer}
                onOpenDetails={setDetailsServer}
                onCopy={handleCopy}
                isLoading={loadingStats.has(server.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              Made with <span className="text-red-500">❤️</span> by{' '}
              <span className="text-white font-medium">{owner_name}</span>
            </p>
            <a
              href={github_repo}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm">View on GitHub</span>
            </a>
          </div>
        </div>
      </footer>

      {showForm && (
        <ServerForm
          server={editingServer}
          existingServers={servers}
          onSubmit={editingServer ? handleEditServer : handleAddServer}
          onCancel={closeForm}
        />
      )}

      {managerServer && (
        <ServerManager
          server={managerServer}
          onClose={() => setManagerServer(undefined)}
        />
      )}

      {detailsServer && (
        <DetailedStatsView
          server={detailsServer}
          onClose={() => setDetailsServer(undefined)}
        />
      )}

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onDataChange={handleDataChange}
        />
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}




  // this project is coded by rishabnotfound
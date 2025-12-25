'use client';

import { useState, useEffect } from 'react';
import { Server, ServerFormData } from '@/types';
import { validateIP } from '@/lib/utils';

interface ServerFormProps {
  server?: Server;
  existingServers: Server[];
  onSubmit: (data: ServerFormData) => void;
  onCancel: () => void;
}

export default function ServerForm({ server, existingServers, onSubmit, onCancel }: ServerFormProps) {
  const [formData, setFormData] = useState<ServerFormData>({
    nickname: '',
    ipAddress: '',
    username: 'root',
    password: '',
    port: 22,
    expiryDate: '',
    hostingProvider: '',
  });

  const [errors, setErrors] = useState<Partial<ServerFormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (server) {
      setFormData({
        nickname: server.nickname,
        ipAddress: server.ipAddress,
        username: server.username,
        password: server.password,
        port: server.port,
        expiryDate: server.expiryDate,
        hostingProvider: server.hostingProvider,
      });
    }
  }, [server]);

  const validate = (): boolean => {
    const newErrors: Partial<ServerFormData> = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Nickname is required';
    }

    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'IP address is required';
    } else if (!validateIP(formData.ipAddress)) {
      newErrors.ipAddress = 'Invalid IP address format';
    } else {
      // Check for duplicate IP (skip check if editing the same server)
      const duplicateIP = existingServers.find(
        s => s.ipAddress === formData.ipAddress && s.id !== server?.id
      );
      if (duplicateIP) {
        newErrors.ipAddress = `This IP is already used by "${duplicateIP.nickname}"`;
      }
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (!formData.port || formData.port < 1 || formData.port > 65535) {
      newErrors.port = 22;
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    }

    if (!formData.hostingProvider.trim()) {
      newErrors.hostingProvider = 'Hosting provider is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyConnection = async (): Promise<boolean> => {
    setVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch('/api/server-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipAddress: formData.ipAddress,
          username: formData.username,
          password: formData.password,
          port: formData.port,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVerifying(false);
        return true;
      } else {
        setVerificationError(data.error || 'Connection failed');
        setVerifying(false);
        return false;
      }
    } catch (error) {
      setVerificationError('Network error. Please check your connection.');
      setVerifying(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Verify connection before submitting
    const isConnected = await verifyConnection();

    if (isConnected) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof ServerFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear verification error when form changes
    if (verificationError) {
      setVerificationError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">
          {server ? 'Edit Server' : 'Add New Server'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nickname
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="My VPS Server"
            />
            {errors.nickname && (
              <p className="text-danger text-xs mt-1">{errors.nickname}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              IP Address
            </label>
            <input
              type="text"
              value={formData.ipAddress}
              onChange={(e) => handleChange('ipAddress', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="192.168.1.1"
            />
            {errors.ipAddress && (
              <p className="text-danger text-xs mt-1">{errors.ipAddress}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SSH Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
                placeholder="root"
              />
              {errors.username && (
                <p className="text-danger text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                SSH Port (default 22)
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => handleChange('port', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
                placeholder="22"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SSH Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-4 py-2 pr-12 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-danger text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Hosting Provider
            </label>
            <input
              type="text"
              value={formData.hostingProvider}
              onChange={(e) => handleChange('hostingProvider', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
              placeholder="Hostinger, Ultahost, Aeza, etc."
            />
            {errors.hostingProvider && (
              <p className="text-danger text-xs mt-1">{errors.hostingProvider}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expiry/Renewal Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-white focus:outline-none focus:border-accent transition-colors"
            />
            {errors.expiryDate && (
              <p className="text-danger text-xs mt-1">{errors.expiryDate}</p>
            )}
          </div>

          {verificationError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-500 font-medium text-sm">Connection Failed</p>
                  <p className="text-red-400 text-xs mt-1">{verificationError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={verifying}
              className="flex-1 py-2 px-4 bg-border hover:bg-border/80 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                server ? 'Update' : 'Add Server'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

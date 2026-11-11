import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { GlassCard } from '../components/GlassCard';
import { ProgressSpinner } from '../components/ProgressSpinner';
import { Copy, Check, Key, Network, WifiHigh, Shield, LinkSimple } from '@phosphor-icons/react';

interface ServerStatus {
  running: boolean;
  address: string;
  port: number;
  apiKey: string;
  queueSize: number;
}

export const APIServerView: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ServerStatus>({
    running: false,
    address: 'localhost',
    port: 8080,
    apiKey: '',
    queueSize: 0,
  });
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localIP, setLocalIP] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const result = await invoke('get_api_server_status');
      setStatus(result as ServerStatus);
    } catch (error) {
      console.error('Failed to fetch server status:', error);
    }
  }, []);

  const fetchLocalIP = useCallback(async () => {
    try {
      const ip = await invoke('get_local_ip');
      setLocalIP(ip as string);
    } catch (error) {
      console.error('Failed to fetch local IP:', error);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchLocalIP();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLocalIP]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await invoke('start_api_server', { port: status.port });
      fetchStatus();
    } catch (error) {
      console.error('Failed to start server:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await invoke('stop_api_server');
      fetchStatus();
    } catch (error) {
      console.error('Failed to stop server:', error);
    } finally {
      setIsStopping(false);
    }
  };

  const handleGenerateKey = async () => {
    try {
      const key = await invoke('generate_api_key');
      setStatus((prev) => ({ ...prev, apiKey: key as string }));
    } catch (error) {
      console.error('Failed to generate key:', error);
    }
  };

  const handleCopyKey = async () => {
    if (status.apiKey) {
      await navigator.clipboard.writeText(status.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayAddress = status.running
    ? `http://${localIP || status.address}:${status.port}`
    : `http://${localIP || status.address}:${status.port}`;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('apiServer.title')}</h2>
          <p className="text-gray-400">{t('apiServer.description')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Network className="w-6 h-6 text-rose-500" weight="duotone" />
              <h3 className="text-lg font-semibold">{t('apiServer.title')}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('apiServer.address')}</span>
                <div className="flex items-center gap-2">
                  <code className="bg-black/30 px-3 py-1 rounded-lg text-sm font-mono text-white">
                    {displayAddress}
                  </code>
                  {status.running && (
                    <span className="flex items-center gap-1 text-green-500 text-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {t('apiServer.running')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">{t('apiServer.port')}</span>
                <input
                  type="number"
                  value={status.port}
                  onChange={(e) => setStatus((prev) => ({ ...prev, port: parseInt(e.target.value) || 8080 }))}
                  disabled={status.running}
                  className="input-field w-32 text-center"
                  min="1024"
                  max="65535"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                {status.running ? (
                  <button
                    onClick={handleStop}
                    disabled={isStopping}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    {isStopping ? (
                      <>
                        <ProgressSpinner size="sm" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <WifiHigh className="w-5 h-5" />
                        {t('apiServer.stop')}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleStart}
                    disabled={isStarting}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {isStarting ? (
                      <>
                        <ProgressSpinner size="sm" />
                        {t('common.loading')}
                      </>
                    ) : (
                      <>
                        <Network className="w-5 h-5" weight="duotone" />
                        {t('apiServer.start')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-rose-500" weight="duotone" />
              <h3 className="text-lg font-semibold">{t('apiServer.apiKey')}</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={status.apiKey}
                  readOnly
                  className="input-field flex-1 font-mono"
                  placeholder={t('apiServer.generateKey')}
                />
                <button
                  onClick={handleCopyKey}
                  disabled={!status.apiKey}
                  className={`btn-secondary flex items-center gap-2 ${!status.apiKey ? 'opacity-50' : ''}`}
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>

              {!status.apiKey && (
                <button
                  onClick={handleGenerateKey}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" weight="duotone" />
                  {t('apiServer.generateKey')}
                </button>
              )}

              {status.apiKey && (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {t('apiServer.security')}
                </p>
              )}
            </div>
          </GlassCard>
        </div>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4">
            <LinkSimple className="w-6 h-6 text-rose-500" weight="duotone" />
            <h3 className="text-lg font-semibold">{t('apiServer.endpoints.title')}</h3>
          </div>

          <div className="space-y-3">
            <div className="glass-card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <code className="bg-black/30 px-3 py-1 rounded-lg text-sm font-mono text-rose-500">
                  POST
                </code>
                <code className="font-mono text-white">/api/convert</code>
              </div>
              <span className="text-gray-400">{t('apiServer.endpoints.convert')}</span>
            </div>

            <div className="glass-card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <code className="bg-black/30 px-3 py-1 rounded-lg text-sm font-mono text-green-500">
                  GET
                </code>
                <code className="font-mono text-white">/api/status</code>
              </div>
              <span className="text-gray-400">{t('apiServer.endpoints.status')}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-black/30 rounded-xl">
            <h4 className="font-medium mb-3">Example Usage (curl)</h4>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${displayAddress}/api/convert"  
  -H "Authorization: Bearer ${status.apiKey || 'YOUR_API_KEY'}"  
  -F "file=@/path/to/file.pdf"  
  -F "target_format=docx"  
  --output converted.docx`}
            </pre>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${displayAddress}/api/convert"  
  -H "Authorization: Bearer ${status.apiKey || 'YOUR_API_KEY'}"  
  -F "file=@/path/to/file.pdf"  
  -F "target_format=docx"  
  --output converted.docx`}
            </pre>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${displayAddress}/api/convert"  
  -H "Authorization: Bearer ${status.apiKey || 'YOUR_API_KEY'}"  
  -F "file=@/path/to/file.pdf"  
  -F "target_format=docx"  
  --output converted.docx`}
            </pre>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${displayAddress}/api/convert"  
  -H "Authorization: Bearer ${status.apiKey || 'YOUR_API_KEY'}"  
  -F "file=@/path/to/file.pdf"  
  -F "target_format=docx"  
  --output converted.docx`}
            </pre>
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto whitespace-pre-wrap">
{`curl -X POST "${displayAddress}/api/convert"  
  -H "Authorization: Bearer ${status.apiKey || 'YOUR_API_KEY'}"  
  -F "file=@/path/to/file.pdf"  
  -F "target_format=docx"  
  --output converted.docx`}
            </pre>
            </pre>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
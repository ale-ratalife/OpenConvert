import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { GlassCard } from '../components/GlassCard';
import { LanguageDropdown } from '../components/FormatDropdown';
import { ProgressSpinner } from '../components/ProgressSpinner';
import { Trash, Info, Palette, Bus, ShieldCheck, ArrowSquareOut } from '@phosphor-icons/react';

export const SettingsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);
  const [version, setVersion] = useState('1.0.0');

  const handleClearCache = useCallback(async () => {
    setClearingCache(true);
    try {
      await invoke('clear_cache');
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setClearingCache(false);
    }
  }, []);

  const handleLanguageChange = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('openconvert-language', lang);
  }, [i18n]);

  React.useEffect(() => {
    invoke('get_app_version').then((v) => setVersion(v as string)).catch(() => {});
  }, []);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('settings.title')}</h2>
        </div>

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-6 h-6 text-rose-500" weight="duotone" />
            <h3 className="text-lg font-semibold">{t('settings.language')}</h3>
          </div>

          <div className="flex items-center gap-4">
            <LanguageDropdown
              value={i18n.language}
              onChange={handleLanguageChange}
              className="w-48"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Bus className="w-6 h-6 text-rose-500" weight="duotone" />
            <h3 className="text-lg font-semibold">{t('settings.theme')}</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="glass-card p-4">
              <div className="w-full h-24 bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-lg border border-white/10" />
              <p className="text-center mt-3 text-gray-400">Dark (Default)</p>
            </div>
            <div className="glass-card p-4 opacity-50">
              <div className="w-full h-24 bg-gradient-to-br from-gray-100 via-white to-gray-200 rounded-lg border border-gray-200" />
              <p className="text-center mt-3 text-gray-400">Light (Coming Soon)</p>
            </div>
            <div className="glass-card p-4 opacity-50">
              <div className="w-full h-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-600" />
              <p className="text-center mt-3 text-gray-400">System (Coming Soon)</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Trash className="w-6 h-6 text-rose-500" weight="duotone" />
            <h3 className="text-lg font-semibold">{t('settings.cache')}</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.clearCache')}</p>
              <p className="text-sm text-gray-400">Remove temporary files and conversion cache</p>
            </div>
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="btn-secondary flex items-center gap-2"
            >
              {clearingCache ? (
                <>
                  <ProgressSpinner size="sm" />
                  {t('common.loading')}
                </>
              ) : cacheCleared ? (
                <>
                  <span className="text-green-500">✓</span>
                  {t('settings.cacheCleared')}
                </>
              ) : (
                <>
                  <Trash className="w-5 h-5" />
                  {t('settings.clearCache')}
                </>
              )}
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-6 h-6 text-rose-500" weight="duotone" />
            <h3 className="text-lg font-semibold">{t('settings.about')}</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('settings.version')}</span>
              <span className="font-mono text-white">{version}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">{t('settings.license')}</span>
              <span className="text-white">{t('settings.license')}</span>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <a
                href="https://alexyalex.site"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-rose-400 hover:underline transition-colors"
              >
                <ArrowSquareOut className="w-4 h-4" weight="duotone" />
                <span>{t('settings.credits')}</span>
              </a>
              <ShieldCheck className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-500" />
            Privacy & Security
          </h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500">✓</span>
              <span>100% offline - no data leaves your machine</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500">✓</span>
              <span>No telemetry, analytics, or tracking</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500">✓</span>
              <span>Open source - verify the code yourself</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500">✓</span>
              <span>Local API server requires authentication</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500">✓</span>
              <span>Temporary files auto-cleaned after conversion</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};
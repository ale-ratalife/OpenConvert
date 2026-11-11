import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageDropdown } from './FormatDropdown';
import { Cube, Network, GearSix, ArrowSquareOut } from '@phosphor-icons/react';

interface SidebarProps {
  activeView: 'converter' | 'apiServer' | 'settings';
  onViewChange: (view: 'converter' | 'apiServer' | 'settings') => void;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  currentLanguage,
  onLanguageChange
}) => {
  const { t } = useTranslation();

  const navItems = [
    { id: 'converter' as const, label: t('nav.converter'), icon: Cube },
    { id: 'apiServer' as const, label: t('nav.apiServer'), icon: Network },
    { id: 'settings' as const, label: t('nav.settings'), icon: GearSix },
  ];

  return (
    <aside className="w-64 glass-panel flex flex-col h-full border-r border-white/10">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
            <Cube className="w-6 h-6 text-white" weight="fill" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('app.name')}</h1>
            <p className="text-xs text-gray-400">{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white border border-white/10'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" weight="duotone" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">
            {t('settings.language')}
          </label>
          <LanguageDropdown
            value={currentLanguage}
            onChange={onLanguageChange}
            className="w-full"
          />
        </div>

        <a
          href="https://alexyalex.site"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:underline text-sm transition-colors"
        >
          <ArrowSquareOut className="w-4 h-4" weight="duotone" />
          <span>{t('settings.credits')}</span>
        </a>
      </div>
    </aside>
  );
};
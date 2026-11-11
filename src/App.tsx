import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sidebar } from './components/Sidebar';
import { ConverterView } from './views/ConverterView';
import { APIServerView } from './views/APIServerView';
import { SettingsView } from './views/SettingsView';

type View = 'converter' | 'apiServer' | 'settings';

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const [activeView, setActiveView] = useState<View>('converter');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('openconvert-language') || 'en';
    setLanguage(savedLang);
    i18n.changeLanguage(savedLang);
  }, [i18n]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('openconvert-language', lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          currentLanguage={language}
          onLanguageChange={handleLanguageChange}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'converter' && <ConverterView />}
          {activeView === 'apiServer' && <APIServerView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { VivaModal } from './components/VivaModal.js';
import { AuthModal } from './components/AuthModal.js';

import { HomePage } from './pages/HomePage.js';
import { TextAnalysisPage } from './pages/TextAnalysisPage.js';
import { ImageAnalysisPage } from './pages/ImageAnalysisPage.js';
import { VoiceAnalysisPage } from './pages/VoiceAnalysisPage.js';
import { MultimodalPage } from './pages/MultimodalPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { DocsPage } from './pages/DocsPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { AdminPage } from './pages/AdminPage.js';

const VALID_ROUTES = [
  'home',
  'text-analysis',
  'image-analysis',
  'voice-analysis',
  'multimodal',
  'dashboard',
  'history',
  'docs',
  'profile',
  'admin'
];

function AppContent() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('emotix_theme') === 'dark' ||
        (!('emotix_theme' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      );
    }
    return false;
  });

  // Navigation state (synced with hash)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (VALID_ROUTES.includes(hash)) {
        return hash;
      }
    }
    return 'home';
  });

  // Modals state
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Apply dark mode class to HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('emotix_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('emotix_theme', 'light');
    }
  }, [isDark]);

  // Sync hash changes with routing state
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (VALID_ROUTES.includes(hash)) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route: string) => {
    setCurrentRoute(route);
    window.location.hash = route;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleDark = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-indigo-500 selection:text-white font-sans">
      <Navbar
        currentRoute={currentRoute}
        navigate={navigate}
        isDark={isDark}
        toggleDark={toggleDark}
        openVivaGuide={() => setIsVivaOpen(true)}
        openAuthModal={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        {currentRoute === 'home' && <HomePage navigate={navigate} openVivaGuide={() => setIsVivaOpen(true)} />}
        {currentRoute === 'text-analysis' && <TextAnalysisPage />}
        {currentRoute === 'image-analysis' && <ImageAnalysisPage />}
        {currentRoute === 'voice-analysis' && <VoiceAnalysisPage />}
        {currentRoute === 'multimodal' && <MultimodalPage />}
        {currentRoute === 'dashboard' && <DashboardPage navigate={navigate} />}
        {currentRoute === 'history' && <HistoryPage />}
        {currentRoute === 'docs' && <DocsPage />}
        {currentRoute === 'profile' && <ProfilePage navigate={navigate} openAuthModal={() => setIsAuthOpen(true)} />}
        {currentRoute === 'admin' && <AdminPage navigate={navigate} />}
      </main>

      <Footer navigate={navigate} />

      <VivaModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

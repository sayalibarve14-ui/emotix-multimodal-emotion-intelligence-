import React, { useState } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  BookOpen,
  Volume2,
  VolumeX,
  User as UserIcon,
  LogOut,
  Shield,
  Mic
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { soundManager } from '../utils/audioFeedback.js';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  isDark: boolean;
  toggleDark: () => void;
  openVivaGuide: () => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  navigate,
  isDark,
  toggleDark,
  openVivaGuide,
  openAuthModal
}) => {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => soundManager.isEnabled());

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'text-analysis', label: 'Text' },
    { id: 'image-analysis', label: 'Vision / Face' },
    { id: 'voice-analysis', label: 'Voice' },
    { id: 'multimodal', label: 'Multimodal AI' },
    { id: 'history', label: 'History' },
    { id: 'docs', label: 'Models & Docs' }
  ];

  const handleNavClick = (id: string) => {
    soundManager.playBlip(440, 0.04);
    navigate(id);
    setMobileMenuOpen(false);
  };

  const handleToggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => handleNavClick('home')}
          className="text-left group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        >
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            EMOTIX
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-5">
          {navLinks.map(link => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded px-1 py-0.5 whitespace-nowrap ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded-lg border transition-colors ${
                currentRoute === 'admin'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
              }`}
            >
              ADMIN
            </button>
          )}
        </nav>

        {/* Zone 3: 1-2 primary actions + theme, sound & user profile */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute audio feedback' : 'Enable audio feedback'}
            title={soundEnabled ? 'Sound Active' : 'Sound Muted'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            title={isDark ? 'Light Theme' : 'Dark Theme'}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Auth Button */}
          {user ? (
            <button
              onClick={() => handleNavClick('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                currentRoute === 'profile'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={`Logged in as ${user.name}`}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open main menu"
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map(link => {
            const isActive = currentRoute === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => handleNavClick('admin')}
              className="w-full text-left px-3 py-2 text-sm rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
            >
              Admin Console
            </button>
          )}

          {user && (
            <button
              onClick={() => handleNavClick('profile')}
              className="w-full text-left px-3 py-2 text-sm rounded-md font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              My Profile ({user.name})
            </button>
          )}

          <div className="pt-2">
            <button
              onClick={() => {
                openVivaGuide();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Viva Defense Guide &amp; Architecture</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

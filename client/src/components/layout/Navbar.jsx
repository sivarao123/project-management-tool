import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  Plus, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  FolderKanban, 
  CheckSquare,
  Sparkles,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';
import GlobalSearchModal from '../modals/GlobalSearchModal';

const Navbar = ({ onToggleSidebar, onOpenNewProject, onOpenNewTask }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, isDark, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Global hotkey Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute readable route breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/tasks')) return 'Tasks';
    if (path.startsWith('/calendar')) return 'Calendar';
    if (path.startsWith('/notifications')) return 'Notifications';
    if (path.startsWith('/team')) return 'Team';
    if (path.startsWith('/settings')) return 'Settings';
    return 'Workspace';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#111418]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] px-4 sm:px-6 h-16 flex items-center justify-between transition-colors">
        {/* Left Section: Mobile Menu + Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl lg:hidden cursor-pointer"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium">TaskFlow</span>
            <span className="text-slate-300 dark:text-white/[0.15]">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{getBreadcrumb()}</span>
          </div>
        </div>

        {/* Center Section: Global Search Trigger */}
        <div className="flex-1 max-w-md mx-3">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/70 hover:bg-slate-100 dark:bg-[#171A1F] dark:hover:bg-[#1E232B] text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl text-xs sm:text-sm border border-transparent hover:border-slate-200 dark:hover:border-white/[0.1] transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              <span className="truncate">Search tasks, projects, commands...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-[#111418] border border-slate-200 dark:border-white/[0.08] rounded shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Right Section: Actions + Theme Toggle + Notifications + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            title={`Current theme: ${theme}. Click to switch.`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Ask AI Copilot button */}
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', metaKey: true }))}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 dark:from-purple-950/40 dark:to-indigo-950/40 dark:hover:from-purple-900/50 dark:hover:to-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 rounded-xl text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Ask TaskFlow AI Copilot (⌘J)"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="hidden md:inline">Ask AI</span>
          </button>

          {/* Quick Create Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </button>

            {isCreateMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCreateMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#171A1F] rounded-2xl shadow-elevated dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      onOpenNewTask?.();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>New Task</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      onOpenNewProject?.();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                    <span>New Project</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(prev => !prev)}
              className={`p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all relative cursor-pointer ${
                isNotifOpen ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white' : ''
              }`}
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#111418] animate-pulse" />
              )}
            </button>

            <NotificationDropdown
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
            />
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-100 dark:hover:ring-indigo-900/50 transition-all cursor-pointer"
            >
              <img
                src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1]"
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#171A1F] rounded-2xl shadow-elevated dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded">
                      {user?.role || 'Member'}
                    </span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>Account Settings</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 dark:border-white/[0.06] pt-1">
                    <button
                      onClick={async () => {
                        setIsUserMenuOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal / Command Palette */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenNewTask={onOpenNewTask}
        onOpenNewProject={onOpenNewProject}
      />
    </>
  );
};

export default Navbar;

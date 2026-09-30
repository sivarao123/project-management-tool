import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  Calendar, 
  Bell, 
  Users, 
  Settings, 
  LogOut, 
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';

const Sidebar = ({ isOpen, setIsOpen, isCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Calendar', path: '/calendar', icon: Calendar },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      badge: unreadCount > 0 ? unreadCount : null 
    },
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 left-0 bottom-0 z-50 bg-white dark:bg-[#111418] border-r border-slate-200/80 dark:border-white/[0.08]
        flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'}
        w-64
      `}>
        {/* App Branding Header */}
        <div className={`p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <NavLink to="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">TaskFlow</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded">PRO</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight truncate">Plan. Collaborate. Done.</p>
              </div>
            )}
          </NavLink>

          {/* Collapse Toggle Button (Desktop only) */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Button */}
        {isCollapsed && (
          <div className="hidden lg:flex justify-center py-2 border-b border-slate-100 dark:border-white/[0.06]">
            <button
              onClick={onToggleCollapse}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live Status indicator */}
        <div className={`px-4 py-2 bg-slate-50/70 dark:bg-[#171A1F]/60 border-b border-slate-100 dark:border-white/[0.06] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-xs`}>
          {!isCollapsed && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-time sync</span>
          )}
          <div className="flex items-center gap-1.5" title={isConnected ? 'Connected to live engine' : 'Reconnecting'}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            {!isCollapsed && (
              <span className={`text-[10px] font-semibold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isConnected ? 'Live' : 'Reconnecting'}
              </span>
            )}
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-3 px-2.5 space-y-1 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={({ isActive }) => `
                  flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group relative
                  ${isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-slate-100'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold bg-rose-500 text-white rounded-full ${isCollapsed ? 'absolute top-1 right-1 w-2 h-2 p-0' : ''}`}>
                    {!isCollapsed && item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User profile footer */}
        <div className="p-2.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#171A1F]/30">
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'} p-2 rounded-xl bg-white dark:bg-[#171A1F] border border-slate-200/60 dark:border-white/[0.06] shadow-xs`}>
            <img 
              src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`} 
              alt={user?.name} 
              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

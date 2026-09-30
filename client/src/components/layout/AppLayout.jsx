import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NewProjectModal from '../modals/NewProjectModal';
import NewTaskModal from '../modals/NewTaskModal';
import TaskFlowCopilot from '../ai/TaskFlowCopilot';
import OfflineBanner from '../common/OfflineBanner';
import { useNotifications } from '../../context/NotificationContext';
import { X, Bell, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('taskflow_sidebar_collapsed') === 'true';
  });
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const { activeToast, dismissToast } = useNotifications();
  const navigate = useNavigate();

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('taskflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getToastBg = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/50';
      case 'error':
        return 'bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/50';
      case 'warning':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50';
      default:
        return 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0D10] text-slate-900 dark:text-[#F3F4F6] flex transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Offline Banner */}
        <OfflineBanner />

        {/* Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
        />

        {/* Real-time Toast Alert */}
        {activeToast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-[#171A1F] rounded-2xl shadow-elevated dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] p-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${getToastBg(activeToast.type)}`}>
                {getToastIcon(activeToast.type)}
              </div>
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (activeToast.link) navigate(activeToast.link);
                  dismissToast();
                }}
              >
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{activeToast.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{activeToast.message}</p>
              </div>
              <button
                onClick={dismissToast}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={(project) => {
          navigate(`/projects/${project.id}`);
        }}
      />

      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onTaskCreated={(task) => {
          navigate(`/projects/${task.project_id}?task=${task.id}`);
        }}
      />

      {/* Global TaskFlow AI Copilot */}
      <TaskFlowCopilot />
    </div>
  );
};

export default AppLayout;

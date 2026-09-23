import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import NewProjectModal from '../modals/NewProjectModal';
import NewTaskModal from '../modals/NewTaskModal';
import TaskFlowCopilot from '../ai/TaskFlowCopilot';
import { useNotifications } from '../../context/NotificationContext';
import { X, Bell } from 'lucide-react';

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const { activeToast, dismissToast } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenNewProject={() => setIsNewProjectOpen(true)}
          onOpenNewTask={() => setIsNewTaskOpen(true)}
        />

        {/* Real-time Toast Alert */}
        {activeToast && (
          <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-indigo-100 p-4 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  if (activeToast.link) navigate(activeToast.link);
                  dismissToast();
                }}
              >
                <p className="text-xs font-bold text-slate-900">{activeToast.title}</p>
                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">{activeToast.message}</p>
              </div>
              <button
                onClick={dismissToast}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  LayoutList, 
  Kanban, 
  Users, 
  Activity as ActivityIcon, 
  Settings, 
  Plus, 
  MoreHorizontal, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  User, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Search, 
  Filter, 
  UserPlus, 
  Trash2, 
  Archive, 
  RotateCcw,
  Check,
  ChevronDown,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import TaskModal from '../components/modals/TaskModal';
import NewTaskModal from '../components/modals/NewTaskModal';
import InviteMemberModal from '../components/modals/InviteMemberModal';
import SprintAIAssistantModal from '../components/ai/SprintAIAssistantModal';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatDistanceToNow, format } from 'date-fns';

const COLUMNS = ['BACKLOG', 'TODO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];

const ProjectWorkspace = () => {
  const { id: projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('board'); // 'overview' | 'board' | 'tasks' | 'members' | 'activity' | 'settings'
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected task for drawer
  const selectedTaskId = searchParams.get('task');
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTaskDefaultStatus, setNewTaskDefaultStatus] = useState('TODO');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Inline quick create task in column
  const [quickAddColumn, setQuickAddColumn] = useState(null);
  const [quickTitle, setQuickTitle] = useState('');

  // Table view filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatus, setTableStatus] = useState('All');

  // Delete project state
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Load project details & tasks
  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true);
      const [projRes, taskRes, actRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/tasks`),
        api.get(`/projects/${projectId}/activities`)
      ]);

      if (projRes.project) setProject(projRes.project);
      if (taskRes.tasks) setTasks(taskRes.tasks);
      if (actRes.activities) setActivities(actRes.activities);
    } catch (err) {
      console.error('Failed to load project workspace:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Real-time socket room subscription
  useEffect(() => {
    if (!projectId) return;
    joinProject(projectId);

    if (!socket) return;

    const handleTaskCreated = (newTask) => {
      setTasks(prev => {
        if (prev.some(t => t.id === newTask.id)) return prev;
        return [...prev, newTask];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks(prev => prev.map(t => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)));
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleMemberAdded = (newMember) => {
      setProject(prev => {
        if (!prev) return prev;
        const exists = prev.members?.some(m => m.user_id === newMember.user_id);
        if (exists) return prev;
        return { ...prev, members: [...(prev.members || []), newMember] };
      });
    };

    const handleMemberRoleUpdated = ({ userId, role }) => {
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members?.map(m => (m.user_id === userId ? { ...m, role } : m))
        };
      });
    };

    const handleMemberRemoved = ({ userId }) => {
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members?.filter(m => m.user_id !== userId)
        };
      });
    };

    const handleActivityNew = (activity) => {
      setActivities(prev => [activity, ...prev]);
    };

    socket.on('task:created', handleTaskCreated);
    socket.on('task:updated', handleTaskUpdated);
    socket.on('task:deleted', handleTaskDeleted);
    socket.on('member:added', handleMemberAdded);
    socket.on('member:role_updated', handleMemberRoleUpdated);
    socket.on('member:removed', handleMemberRemoved);
    socket.on('activity:new', handleActivityNew);

    return () => {
      leaveProject(projectId);
      socket.off('task:created', handleTaskCreated);
      socket.off('task:updated', handleTaskUpdated);
      socket.off('task:deleted', handleTaskDeleted);
      socket.off('member:added', handleMemberAdded);
      socket.off('member:role_updated', handleMemberRoleUpdated);
      socket.off('member:removed', handleMemberRemoved);
      socket.off('activity:new', handleActivityNew);
    };
  }, [socket, projectId, joinProject, leaveProject]);

  // Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = (e, column) => {
    if (dragOverColumn === column) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskIdStr = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);

    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || targetTask.status === targetColumn) {
      setDraggingTaskId(null);
      return;
    }

    const previousStatus = targetTask.status;

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetColumn } : t))
    );
    setDraggingTaskId(null);

    try {
      await api.put(`/tasks/${taskId}`, { status: targetColumn });
    } catch (err) {
      // Revert optimistic move on failure
      setTasks(prev =>
        prev.map(t => (t.id === taskId ? { ...t, status: previousStatus } : t))
      );
      showToast({ type: 'error', title: 'Move Failed', message: 'Unable to update task position. Restoring card.' });
    }
  };

  // Quick inline add task in a column
  const handleQuickAdd = async (column) => {
    if (!quickTitle.trim()) {
      setQuickAddColumn(null);
      return;
    }

    try {
      const res = await api.post(`/projects/${projectId}/tasks`, {
        title: quickTitle.trim(),
        status: column,
        priority: 'Medium'
      });
      if (res.task) {
        setTasks(prev => [...prev, res.task]);
        setQuickTitle('');
        setQuickAddColumn(null);
        showToast({ type: 'success', title: 'Task Created', message: res.task.title });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Task Creation Failed', message: err.message });
    }
  };

  // Project Settings Update
  const [settingsName, setSettingsName] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsPriority, setSettingsPriority] = useState('Medium');
  const [settingsColor, setSettingsColor] = useState('#4F46E5');

  useEffect(() => {
    if (project) {
      setSettingsName(project.name);
      setSettingsDesc(project.description || '');
      setSettingsPriority(project.priority || 'Medium');
      setSettingsColor(project.color || '#4F46E5');
    }
  }, [project]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/projects/${projectId}`, {
        name: settingsName.trim(),
        description: settingsDesc.trim(),
        priority: settingsPriority,
        color: settingsColor
      });
      if (res.project) {
        setProject(prev => ({ ...prev, ...res.project }));
        showToast({ type: 'success', title: 'Project Updated', message: 'Settings saved successfully.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeletingProject(true);
      await api.delete(`/projects/${projectId}`);
      showToast({ type: 'success', title: 'Project Deleted', message: 'Project removed.' });
      setIsDeleteProjectOpen(false);
      navigate('/projects');
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/projects/${projectId}/members/${userId}`, { role: newRole });
      setProject(prev => ({
        ...prev,
        members: prev.members.map(m => (m.user_id === userId ? { ...m, role: newRole } : m))
      }));
      showToast({ type: 'success', title: 'Role Updated', message: `Updated to ${newRole}` });
    } catch (err) {
      showToast({ type: 'error', title: 'Role Update Failed', message: err.message });
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m.user_id !== userId)
      }));
      showToast({ type: 'info', title: 'Member Removed', message: 'Member removed from project.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Remove Failed', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08]" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-96 bg-slate-100/70 dark:bg-[#111418]/60 rounded-2xl border border-slate-200/80 dark:border-white/[0.08]" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">This project may have been deleted or you do not have permission.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Workspace Header */}
      <div className="bg-white dark:bg-[#111418] p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span 
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
              style={{ backgroundColor: project.color || '#4F46E5' }} 
            />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {project.name}
            </h1>
            <Badge priority={project.priority} size="xs" />
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
              Role: {project.user_role || 'Member'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-2xl leading-relaxed">
            {project.description || 'Collaborative workspace board.'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAICopilotOpen(true)}
            icon={Sparkles}
          >
            AI Sprint Copilot
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsInviteOpen(true)}
            icon={UserPlus}
          >
            Invite
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setNewTaskDefaultStatus('TODO');
              setIsNewTaskOpen(true);
            }}
            icon={Plus}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/[0.08] pb-px overflow-x-auto">
        {[
          { id: 'board', label: 'Board', icon: Kanban },
          { id: 'tasks', label: 'Tasks', icon: LayoutList },
          { id: 'overview', label: 'Overview', icon: FolderKanban },
          { id: 'members', label: `Members (${project.members?.length || 1})`, icon: Users },
          { id: 'activity', label: 'Activity', icon: ActivityIcon },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-white/70 dark:bg-white/[0.02]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: KANBAN BOARD */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
          {COLUMNS.map((column) => {
            const columnTasks = tasks
              .filter(t => t.status === column)
              .sort((a, b) => (a.position || 0) - (b.position || 0));

            const isDropTarget = dragOverColumn === column;

            return (
              <div
                key={column}
                onDragOver={(e) => handleDragOver(e, column)}
                onDragLeave={(e) => handleDragLeave(e, column)}
                onDrop={(e) => handleDrop(e, column)}
                className={`bg-slate-100/70 dark:bg-[#111418]/60 rounded-2xl border flex flex-col max-h-[78vh] transition-all ${
                  isDropTarget 
                    ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-200 dark:ring-indigo-900/50' 
                    : 'border-slate-200/80 dark:border-white/[0.08]'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#171A1F]/50 rounded-t-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase truncate">
                      {column}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200/80 dark:bg-[#1F242C] text-slate-600 dark:text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNewTaskDefaultStatus(column);
                      setIsNewTaskOpen(true);
                    }}
                    title={`Add task to ${column}`}
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#111418] rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto kanban-column-scroll min-h-[140px]">
                  {columnTasks.map((task) => {
                    const isDragging = draggingTaskId === task.id;
                    const isOverdue = task.due_date && task.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && task.status !== 'DONE';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSearchParams({ task: task.id })}
                        className={`p-3.5 bg-white dark:bg-[#171A1F] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] hover:shadow-card-hover dark:hover:shadow-dark-card cursor-pointer transition-all space-y-2.5 group relative ${
                          isDragging ? 'opacity-35 scale-95' : ''
                        }`}
                      >
                        {/* Priority & Labels row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge priority={task.priority} dot size="xs" />
                          {task.labels?.map((lbl) => (
                            <span
                              key={lbl.id}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm text-white"
                              style={{ backgroundColor: lbl.color }}
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                          {task.title}
                        </h4>

                        {/* Meta info footer */}
                        <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                          {/* Due Date */}
                          {task.due_date ? (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(task.due_date), 'MMM d')}</span>
                            </div>
                          ) : (
                            <span />
                          )}

                          {/* Indicators & Assignee */}
                          <div className="flex items-center gap-2">
                            {task.comments_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px]">
                                <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                {task.comments_count}
                              </span>
                            )}
                            {task.attachments_count > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px]">
                                <Paperclip className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                {task.attachments_count}
                              </span>
                            )}

                            {task.assignee_avatar ? (
                              <img
                                src={task.assignee_avatar}
                                alt={task.assignee_name}
                                title={`Assigned to ${task.assignee_name}`}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1]"
                              />
                            ) : task.assignee_name ? (
                              <div
                                title={`Assigned to ${task.assignee_name}`}
                                className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[9px]"
                              >
                                {task.assignee_name[0]}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Inline quick add */}
                  {quickAddColumn === column ? (
                    <div className="p-2.5 bg-white dark:bg-[#171A1F] rounded-xl border border-indigo-400 dark:border-indigo-500 shadow-xs space-y-2">
                      <input
                        type="text"
                        value={quickTitle}
                        onChange={(e) => setQuickTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleQuickAdd(column);
                          if (e.key === 'Escape') setQuickAddColumn(null);
                        }}
                        placeholder="Task title..."
                        className="w-full text-xs font-medium border-0 focus:ring-0 p-1 text-slate-800 dark:text-slate-200 bg-transparent focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button size="xs" variant="secondary" onClick={() => setQuickAddColumn(null)}>
                          Cancel
                        </Button>
                        <Button size="xs" variant="primary" onClick={() => handleQuickAdd(column)}>
                          Add
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setQuickAddColumn(column);
                        setQuickTitle('');
                      }}
                      className="w-full py-1.5 px-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.04] text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add card</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: TASKS LIST VIEW */}
      {activeTab === 'tasks' && (
        <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden space-y-4 p-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Search tasks in this project..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tableStatus}
                onChange={(e) => setTableStatus(e.target.value)}
                className="text-xs font-medium border border-slate-200 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 bg-white dark:bg-[#171A1F] text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="All">All Columns</option>
                {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-[#171A1F]/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-y border-slate-100 dark:border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {tasks
                  .filter(t => (tableStatus === 'All' || t.status === tableStatus) &&
                    (t.title.toLowerCase().includes(tableSearch.toLowerCase())))
                  .map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => setSearchParams({ task: task.id })}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {task.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge status={task.status} size="xs" />
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge priority={task.priority} size="xs" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {task.assignee_avatar && (
                            <img src={task.assignee_avatar} alt="" className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200" />
                          )}
                          <span>{task.assignee_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111418] p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Mission & Details</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description || 'No detailed mission description available.'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-[#171A1F] rounded-xl border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Priority</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.priority}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#171A1F] rounded-xl border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Status</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{project.status}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#171A1F] rounded-xl border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Start Date</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#171A1F] rounded-xl border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Target Due</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {project.due_date ? format(new Date(project.due_date), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Task Completion Progress */}
            <div className="bg-white dark:bg-[#111418] p-6 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">Overall Deliverables Progress</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{project.stats?.progress || 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                  style={{ width: `${project.stats?.progress || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Team */}
          <div className="bg-white dark:bg-[#111418] p-5 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Members</h3>
            <div className="space-y-3">
              {project.members?.map(m => (
                <div key={m.user_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}`}
                      alt={m.name}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1]"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{m.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1F242C] text-slate-600 dark:text-slate-400">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS MANAGEMENT */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Members & Access</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Collaborators assigned to this initiative.</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsInviteOpen(true)}
              icon={UserPlus}
            >
              Add Member
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {project.members?.map((member) => (
              <div key={member.user_id} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1]"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{member.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={member.role}
                    disabled={member.role === 'Owner'}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                    className="text-xs font-semibold border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1 bg-white dark:bg-[#171A1F] text-slate-700 dark:text-slate-200 disabled:opacity-60 cursor-pointer"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Member">Member</option>
                    <option value="Viewer">Viewer</option>
                  </select>

                  {member.role !== 'Owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                      title="Remove member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-6 space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Audit Timeline</h3>
          <div className="space-y-4 max-w-2xl">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-6">No activity recorded yet for this project.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <img
                    src={act.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user_name || 'U')}`}
                    alt=""
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <strong className="font-semibold text-slate-900 dark:text-white">{act.user_name}</strong>{' '}
                      {act.action === 'created_project' && 'created this project'}
                      {act.action === 'created_task' && (
                        <span>created task <strong>{act.metadata?.title}</strong></span>
                      )}
                      {act.action === 'moved_task' && (
                        <span>
                          moved <strong>{act.metadata?.title}</strong> from {act.metadata?.from} to{' '}
                          <strong className="text-indigo-600 dark:text-indigo-400">{act.metadata?.to}</strong>
                        </span>
                      )}
                      {act.action === 'added_comment' && (
                        <span>commented on task <strong>{act.metadata?.taskTitle}</strong></span>
                      )}
                      {act.action === 'added_member' && (
                        <span>added <strong>{act.metadata?.memberName}</strong> as {act.metadata?.role}</span>
                      )}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                      {act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Project Configuration</h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={settingsDesc}
                  onChange={(e) => setSettingsDesc(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
                  <select
                    value={settingsPriority}
                    onChange={(e) => setSettingsPriority(e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Color Theme</label>
                  <input
                    type="color"
                    value={settingsColor}
                    onChange={(e) => setSettingsColor(e.target.value)}
                    className="w-full h-9 border border-slate-200 dark:border-white/[0.08] rounded-xl p-1 bg-white dark:bg-[#171A1F] cursor-pointer"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" size="sm">
                Save Changes
              </Button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/80 dark:border-rose-900/30 p-6 space-y-3">
            <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Danger Zone</h4>
            <p className="text-xs text-rose-600 dark:text-rose-300/80 leading-relaxed">
              Permanently delete this project and all associated tasks, comments, and files. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteProjectOpen(true)}
              icon={Trash2}
            >
              Delete Project
            </Button>
          </div>
        </div>
      )}

      {/* Task Details Drawer */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
          onTaskUpdated={(updated) => {
            setTasks(prev => prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)));
          }}
          onTaskDeleted={(deletedId) => {
            setTasks(prev => prev.filter(t => t.id !== Number(deletedId)));
          }}
          projectMembers={project.members || []}
          projectLabels={project.labels || []}
        />
      )}

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        defaultProjectId={projectId}
        defaultStatus={newTaskDefaultStatus}
        onTaskCreated={(newTask) => {
          setTasks(prev => [...prev, newTask]);
        }}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        projectId={projectId}
        currentMemberUserIds={project.members?.map(m => m.user_id) || []}
        onMemberAdded={(newMember) => {
          setProject(prev => ({
            ...prev,
            members: [...(prev.members || []), newMember]
          }));
        }}
      />

      {/* AI Sprint Assistant Modal */}
      <SprintAIAssistantModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        projectId={projectId}
        projectName={project.name}
        onTasksCreated={loadWorkspace}
      />

      {/* Project Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteProjectOpen}
        title="Delete this project?"
        description="This will permanently delete the project, all its tasks, attachments, comments, and activity history. This cannot be undone."
        confirmText="Delete Project"
        isLoading={isDeletingProject}
        onConfirm={handleDeleteProject}
        onClose={() => setIsDeleteProjectOpen(false)}
      />

    </div>
  );
};

export default ProjectWorkspace;

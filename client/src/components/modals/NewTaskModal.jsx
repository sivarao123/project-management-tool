import React, { useState, useEffect } from 'react';
import { X, CheckSquare } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';

const COLUMNS = ['BACKLOG', 'TODO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];

const NewTaskModal = ({ isOpen, onClose, onTaskCreated, defaultProjectId, defaultStatus }) => {
  const { showToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(defaultStatus || 'TODO');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [members, setMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      // Load user projects
      api.get('/projects').then(res => {
        if (res.projects) {
          setProjects(res.projects);
          if (!projectId && res.projects.length > 0) {
            setProjectId(res.projects[0].id);
          }
        }
      });
      setStatus(defaultStatus || 'TODO');
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setAssigneeId('');

      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, defaultProjectId, defaultStatus, onClose]);

  // Load project members when projectId changes
  useEffect(() => {
    if (projectId) {
      api.get(`/projects/${projectId}/members`).then(res => {
        if (res.members) {
          setMembers(res.members);
        }
      }).catch(() => setMembers([]));
    }
  }, [projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${projectId}/tasks`, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId ? Number(assigneeId) : null
      });

      if (res.task) {
        showToast({ type: 'success', title: 'Task Created', message: res.task.title });
        onTaskCreated?.(res.task);
        onClose();
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Creation Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#111418] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-[#171A1F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            >
              {projects.length === 0 && <option value="">Loading projects...</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement OAuth login or Design landing page"
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe requirements, acceptance criteria, or context..."
              className="w-full text-xs text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#171A1F] rounded-xl p-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Grid row: Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Board Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {COLUMNS.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Grid row: Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
              disabled={!title.trim()}
            >
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;

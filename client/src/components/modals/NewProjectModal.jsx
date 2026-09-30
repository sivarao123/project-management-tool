import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Check } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';

const COLOR_PRESETS = [
  '#4F46E5', // Indigo
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#14B8A6', // Teal
];

const NewProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const { showToast } = useNotifications();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [priority, setPriority] = useState('Medium');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      setName('');
      setDescription('');
      setColor('#4F46E5');
      setPriority('Medium');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setSelectedUserIds([]);

      // Fetch users for member selection
      api.get('/users').then(res => {
        if (res.users) setAllUsers(res.users);
      }).catch(() => setAllUsers([]));

      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post('/projects', {
        name: name.trim(),
        description: description.trim(),
        color,
        priority,
        start_date: startDate || null,
        due_date: dueDate || null,
        members: selectedUserIds.map(id => ({ userId: id, role: 'Member' }))
      });

      if (res.project) {
        showToast({ type: 'success', title: 'Project Created', message: res.project.name });
        onProjectCreated?.(res.project);
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
      <div className="bg-white dark:bg-[#111418] w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-[#171A1F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Project</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign or Marketing Campaign"
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of project goals, team mission, or milestone deliverables..."
              className="w-full text-xs text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-[#171A1F] rounded-xl p-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Color theme presets */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Project Color</label>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setColor(preset)}
                  className="w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer hover:scale-110 ring-2 ring-transparent hover:ring-slate-300 dark:hover:ring-slate-600"
                  style={{ backgroundColor: preset }}
                >
                  {color === preset && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Priority & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
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

          {/* Team Members */}
          {allUsers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Add Team Members ({selectedUserIds.length} selected)
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200/80 dark:border-white/[0.08] rounded-xl p-2 bg-slate-50/50 dark:bg-[#171A1F]">
                {allUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className="p-1.5 rounded-lg flex items-center justify-between hover:bg-white dark:hover:bg-[#1F242C] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1]"
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">({u.email})</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
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
              disabled={!name.trim()}
            >
              Create Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;

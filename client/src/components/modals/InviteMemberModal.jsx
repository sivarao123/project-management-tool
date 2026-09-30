import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../common/Button';

const InviteMemberModal = ({ isOpen, onClose, projectId, onMemberAdded, currentMemberUserIds = [] }) => {
  const { showToast } = useNotifications();
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState('Member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      setSelectedUserId('');
      setEmailInput('');
      setRole('Member');
      setError(null);

      api.get('/users').then(res => {
        if (res.users) {
          // Filter out users who are already members
          const available = res.users.filter(u => !currentMemberUserIds.includes(u.id));
          setAllUsers(available);
          if (available.length > 0) {
            setSelectedUserId(available[0].id);
          }
        }
      }).catch(() => setAllUsers([]));

      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, currentMemberUserIds, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = { role };
    if (selectedUserId) {
      payload.userId = Number(selectedUserId);
    } else if (emailInput.trim()) {
      payload.email = emailInput.trim();
    } else {
      setError('Please select a user or enter an email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/projects/${projectId}/members`, payload);
      if (res.member) {
        showToast({ type: 'success', title: 'Member Added', message: `${res.member.name} added as ${res.member.role}` });
        onMemberAdded?.(res.member);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to add member to the project.');
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
      <div className="bg-white dark:bg-[#111418] w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/50 dark:bg-[#171A1F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add Team Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* User selector dropdown */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Select Existing Member</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                if (e.target.value) setEmailInput('');
              }}
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose member from directory --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
            <div className="h-px bg-slate-200 dark:border-white/[0.08] flex-1" />
            <span>or invite by email</span>
            <div className="h-px bg-slate-200 dark:border-white/[0.08] flex-1" />
          </div>

          {/* Email input */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (e.target.value) setSelectedUserId('');
              }}
              placeholder="colleague@taskflow.dev"
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Admin">Admin (Can manage project settings, tasks, and invite members)</option>
              <option value="Member">Member (Can create, edit, drag, and comment on tasks)</option>
              <option value="Viewer">Viewer (Read-only access to board and tasks)</option>
            </select>
          </div>

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
              disabled={!selectedUserId && !emailInput.trim()}
            >
              Add Member
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import api from '../../services/api';

const InviteMemberModal = ({ isOpen, onClose, projectId, onMemberAdded, currentMemberUserIds = [] }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState('Member');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen, currentMemberUserIds]);

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
        onMemberAdded?.(res.member);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Add Team Member</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600">
              {error}
            </div>
          )}

          {/* User selector dropdown */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Select Existing Member</label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                if (e.target.value) setEmailInput('');
              }}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Choose member from directory --</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="h-px bg-slate-200 flex-1" />
            <span>or invite by email</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Email input */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Email Address</label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
                if (e.target.value) setSelectedUserId('');
              }}
              placeholder="colleague@taskflow.dev"
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role selector */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Project Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Admin">Admin (Can manage project settings, tasks, and invite members)</option>
              <option value="Member">Member (Can create, edit, drag, and comment on tasks)</option>
              <option value="Viewer">Viewer (Read-only access to board and tasks)</option>
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!selectedUserId && !emailInput.trim())}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Add Member</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;

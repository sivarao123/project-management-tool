import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Mail,
  FolderKanban,
  CheckSquare,
  Plus,
  Search,
  X,
  Shield,
  Check,
  AlertCircle,
  ExternalLink,
  Filter,
  Sparkles,
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

const TeamPage = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotifications();

  const [users, setUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');

  // Modal State for adding project to user
  const [assignModalUser, setAssignModalUser] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedRole, setSelectedRole] = useState('Member');
  const [assigning, setAssigning] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch team directory and workspace projects
  const fetchDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, projsRes] = await Promise.all([
        api.get('/users'),
        api.get('/projects')
      ]);

      if (usersRes.users) setUsers(usersRes.users);
      if (projsRes.projects) setAllProjects(projsRes.projects);
    } catch (err) {
      console.error('Failed to fetch team directory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleMemberAssigned = ({ userId, project }) => {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            const currentProjs = u.projects || [];
            const exists = currentProjs.some(p => p.id === project.id);
            const updatedProjs = exists
              ? currentProjs.map(p => (p.id === project.id ? { ...p, role: project.role } : p))
              : [...currentProjs, project];
            return {
              ...u,
              project_count: updatedProjs.length,
              projects: updatedProjs
            };
          }
          return u;
        })
      );
    };

    const handleMemberUnassigned = ({ userId, projectId }) => {
      setUsers(prev =>
        prev.map(u => {
          if (u.id === userId) {
            const currentProjs = u.projects || [];
            const updatedProjs = currentProjs.filter(p => p.id !== projectId);
            return {
              ...u,
              project_count: updatedProjs.length,
              projects: updatedProjs
            };
          }
          return u;
        })
      );
    };

    socket.on('user:assigned_project', handleMemberAssigned);
    socket.on('user:unassigned_project', handleMemberUnassigned);

    return () => {
      socket.off('user:assigned_project', handleMemberAssigned);
      socket.off('user:unassigned_project', handleMemberUnassigned);
    };
  }, [socket]);

  // Handle assigning user to project
  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !assignModalUser) return;

    try {
      setAssigning(true);
      setModalError('');

      await api.post(`/projects/${selectedProjectId}/members`, {
        email: assignModalUser.email,
        role: selectedRole
      });

      const assignedProject = allProjects.find(p => p.id === Number(selectedProjectId));

      setUsers(prev =>
        prev.map(u => {
          if (u.id === assignModalUser.id) {
            const currentProjs = u.projects || [];
            const updated = [
              ...currentProjs,
              {
                id: Number(selectedProjectId),
                name: assignedProject?.name || 'Project',
                color: assignedProject?.color || '#6366F1',
                role: selectedRole
              }
            ];
            return { ...u, project_count: updated.length, projects: updated };
          }
          return u;
        })
      );

      showToast({
        type: 'success',
        title: 'Project Assigned',
        message: `${assignModalUser.name} added to "${assignedProject?.name}".`
      });

      setAssignModalUser(null);
      setSelectedProjectId('');
      setSelectedRole('Member');
    } catch (err) {
      setModalError(err.message || 'Failed to assign project.');
    } finally {
      setAssigning(false);
    }
  };

  // Handle removing user from project
  const handleRemoveProject = async (member, proj, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/projects/${proj.id}/members/${member.id}`);

      setUsers(prev =>
        prev.map(u => {
          if (u.id === member.id) {
            const updated = (u.projects || []).filter(p => p.id !== proj.id);
            return { ...u, project_count: updated.length, projects: updated };
          }
          return u;
        })
      );

      showToast({
        type: 'info',
        title: 'Member Removed',
        message: `Removed ${member.name} from "${proj.name}".`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Remove Failed',
        message: err.message || 'Failed to remove from project.'
      });
    }
  };

  // Filter users by search and project filter
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedProjectFilter === 'ALL') return true;

    return (u.projects || []).some(p => p.id === Number(selectedProjectFilter));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Team & Collaborators</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            View team members, manage assigned initiatives, and allocate collaborators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colleagues..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#111418] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Project Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1 shrink-0">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        <button
          onClick={() => setSelectedProjectFilter('ALL')}
          className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
            selectedProjectFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-[#111418] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]'
          }`}
        >
          All Members ({users.length})
        </button>
        {allProjects.map((proj) => {
          const count = users.filter(u => (u.projects || []).some(p => p.id === proj.id)).length;
          return (
            <button
              key={proj.id}
              onClick={() => setSelectedProjectFilter(String(proj.id))}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedProjectFilter === String(proj.id)
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#111418] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color || '#6366F1' }} />
              <span>{proj.name}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-8 space-y-2">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No team members match your criteria</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Try resetting the project filter or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((member) => {
            const memberProjects = member.projects || [];
            const isCurrentUser = member.id === currentUser?.id;

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] hover:shadow-card-hover dark:hover:shadow-dark-card p-5 space-y-4 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{member.name}</h3>
                        {isCurrentUser && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Assigned Projects */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <span>Assigned Initiatives ({memberProjects.length})</span>
                      <button
                        onClick={() => {
                          setAssignModalUser(member);
                          setSelectedProjectId('');
                          setSelectedRole('Member');
                          setModalError('');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Assign</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {memberProjects.length === 0 ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">No assigned projects</span>
                      ) : (
                        memberProjects.map((p) => (
                          <div
                            key={p.id}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#171A1F] border border-slate-200/60 dark:border-white/[0.06] text-xs font-medium text-slate-700 dark:text-slate-300 group/tag"
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color || '#4F46E5' }} />
                            <Link to={`/projects/${p.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 truncate max-w-[120px]">
                              {p.name}
                            </Link>
                            <button
                              onClick={(e) => handleRemoveProject(member, p, e)}
                              className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                              title="Remove from project"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer KPIs */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.assigned_tasks_count || 0} active tasks</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#171A1F] text-slate-600 dark:text-slate-400">
                    {member.role || 'Member'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign to Project Modal */}
      {assignModalUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAssignModalUser(null);
          }}
        >
          <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-2xl dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Assign {assignModalUser.name}
              </h3>
              <button
                onClick={() => setAssignModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAssignProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Project
                </label>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {allProjects.map((p) => {
                    const isAlreadyMember = (assignModalUser.projects || []).some(up => up.id === p.id);
                    const isSelected = selectedProjectId === String(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (!isAlreadyMember) setSelectedProjectId(String(p.id));
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isAlreadyMember
                            ? 'bg-slate-50 dark:bg-[#171A1F]/40 border-slate-200/50 dark:border-white/[0.04] opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 cursor-pointer'
                            : 'bg-white dark:bg-[#171A1F] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#4F46E5' }} />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.name}</span>
                        </div>
                        {isAlreadyMember ? (
                          <span className="text-[10px] text-slate-400">Already in project</span>
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Permissions Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-white dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Member">Member (Create & edit assigned tasks)</option>
                  <option value="Admin">Admin (Full project management)</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAssignModalUser(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={assigning}
                  disabled={!selectedProjectId}
                >
                  Assign to Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamPage;

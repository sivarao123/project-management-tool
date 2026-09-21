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
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const TeamPage = () => {
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

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
  const [notification, setNotification] = useState(null);

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

    socket.on('team:member_assigned', handleMemberAssigned);
    socket.on('team:member_unassigned', handleMemberUnassigned);

    return () => {
      socket.off('team:member_assigned', handleMemberAssigned);
      socket.off('team:member_unassigned', handleMemberUnassigned);
    };
  }, [socket]);

  // Open Assign Modal for a member
  const handleOpenAssignModal = (member) => {
    setAssignModalUser(member);
    setModalError('');
    // Find first project member is NOT in
    const memberProjIds = new Set((member.projects || []).map(p => p.id));
    const available = allProjects.filter(p => !memberProjIds.has(p.id));
    setSelectedProjectId(available.length > 0 ? String(available[0].id) : '');
    setSelectedRole('Member');
  };

  // Submit project assignment
  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setModalError('Please select a project to assign.');
      return;
    }

    try {
      setAssigning(true);
      setModalError('');

      const res = await api.post(`/users/${assignModalUser.id}/projects`, {
        projectId: Number(selectedProjectId),
        role: selectedRole
      });

      const assignedProject = allProjects.find(p => p.id === Number(selectedProjectId));

      // Update local state
      setUsers(prev =>
        prev.map(u => {
          if (u.id === assignModalUser.id) {
            const newProjs = res.projects || [
              ...(u.projects || []),
              {
                id: Number(selectedProjectId),
                name: assignedProject?.name || 'New Project',
                color: assignedProject?.color || '#6366F1',
                role: selectedRole
              }
            ];
            return {
              ...u,
              project_count: newProjs.length,
              projects: newProjs
            };
          }
          return u;
        })
      );

      setNotification({
        type: 'success',
        message: `Successfully added ${assignModalUser.name} to "${assignedProject?.name}".`
      });

      setTimeout(() => setNotification(null), 4000);
      setAssignModalUser(null);
    } catch (err) {
      setModalError(err.message || 'Failed to assign project.');
    } finally {
      setAssigning(false);
    }
  };

  // Remove member from a project
  const handleRemoveFromProject = async (member, proj) => {
    if (!window.confirm(`Remove ${member.name} from project "${proj.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/users/${member.id}/projects/${proj.id}`);

      setUsers(prev =>
        prev.map(u => {
          if (u.id === member.id) {
            const newProjs = (u.projects || []).filter(p => p.id !== proj.id);
            return {
              ...u,
              project_count: newProjs.length,
              projects: newProjs
            };
          }
          return u;
        })
      );

      setNotification({
        type: 'success',
        message: `Removed ${member.name} from "${proj.name}".`
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to remove from project.'
      });
      setTimeout(() => setNotification(null), 4000);
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
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-medium border animate-in slide-in-from-top duration-200 ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Team & Collaborators</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View team members, manage assigned projects, and allocate collaborators across initiatives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colleagues..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Project Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1 shrink-0">
          <Filter className="w-3 h-3" /> Filter by Project:
        </span>
        <button
          onClick={() => setSelectedProjectFilter('ALL')}
          className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
            selectedProjectFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                selectedProjectFilter === String(proj.id)
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading team directory...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No team members match your criteria</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the project filter or search keyword.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((member) => {
            const memberProjects = member.projects || [];
            const isCurrentUser = member.id === currentUser?.id;

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card p-5 space-y-4 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Member Profile Header */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                      alt=""
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {member.name}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[10px] font-normal text-slate-400">(You)</span>
                          )}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 shrink-0">
                          {member.role || 'Member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl">
                    {member.bio || 'Productive collaborator at TaskFlow.'}
                  </p>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                      <FolderKanban className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span><strong>{memberProjects.length}</strong> projects</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span><strong>{member.active_tasks_count || 0}</strong> active tasks</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Section ON THE CARD */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                      <span>Projects ({memberProjects.length})</span>
                    </span>

                    <button
                      onClick={() => handleOpenAssignModal(member)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 transition-colors shadow-2xs cursor-pointer"
                      title={`Assign ${member.name} to a project`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {/* Project Pills */}
                  {memberProjects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {memberProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="group relative inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg text-[11px] font-medium bg-slate-50 hover:bg-indigo-50/60 text-slate-700 hover:text-indigo-900 border border-slate-200/80 hover:border-indigo-200 transition-all"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: proj.color || '#6366F1' }}
                          />
                          <Link
                            to={`/projects/${proj.id}`}
                            className="hover:underline truncate max-w-[130px] font-semibold text-slate-800"
                            title={`Go to ${proj.name}`}
                          >
                            {proj.name}
                          </Link>
                          <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                            {proj.role || 'Member'}
                          </span>

                          {/* Unassign button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromProject(member, proj);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 rounded hover:bg-rose-50"
                            title={`Remove from ${proj.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-dashed border-amber-200/70 text-center">
                      <p className="text-[11px] text-amber-700 font-medium">No projects assigned yet</p>
                      <button
                        onClick={() => handleOpenAssignModal(member)}
                        className="mt-1 text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        + Assign first project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Project Modal */}
      {assignModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <img
                  src={assignModalUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignModalUser.name)}`}
                  alt=""
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-100"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Project to Member</h3>
                  <p className="text-xs text-slate-500">Assign <strong>{assignModalUser.name}</strong> to a project</p>
                </div>
              </div>
              <button
                onClick={() => setAssignModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAssignProject} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Project Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Project
                </label>
                {allProjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No projects found in workspace.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
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
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 cursor-pointer'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: p.color || '#6366F1' }}
                            />
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {p.total_tasks || 0} tasks • {p.member_count || 1} members
                              </p>
                            </div>
                          </div>

                          {isAlreadyMember ? (
                            <span className="text-[10px] font-semibold text-slate-500 px-2 py-0.5 rounded bg-slate-200/70 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Member
                            </span>
                          ) : isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Project Permissions Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Member', 'Admin', 'Viewer'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedRole === role
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span className="block text-xs">{role}</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        {role === 'Admin' ? 'Full Access' : role === 'Member' ? 'Standard' : 'Read-only'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setAssignModalUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedProjectId}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {assigning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign to Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;

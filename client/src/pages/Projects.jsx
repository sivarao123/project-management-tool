import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Archive, 
  RotateCcw, 
  Trash2, 
  MoreVertical,
  Layers,
  Users,
  Clock,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import NewProjectModal from '../components/modals/NewProjectModal';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ProjectCardSkeleton } from '../components/common/Skeleton';
import { format } from 'date-fns';

const Projects = () => {
  const { showToast } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Confirm delete dialog
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects?archived=${showArchived}`);
      if (res.projects) {
        setProjects(res.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [showArchived]);

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/projects/${id}/archive`);
      showToast({ type: 'info', title: 'Project Archived', message: 'Project moved to archive.' });
      fetchProjects();
    } catch (err) {
      showToast({ type: 'error', title: 'Archive Failed', message: err.message });
    }
    setActiveMenuId(null);
  };

  const handleRestore = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/projects/${id}/restore`);
      showToast({ type: 'success', title: 'Project Restored', message: 'Project restored to active workspace.' });
      fetchProjects();
    } catch (err) {
      showToast({ type: 'error', title: 'Restore Failed', message: err.message });
    }
    setActiveMenuId(null);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/projects/${projectToDelete}`);
      showToast({ type: 'success', title: 'Project Deleted', message: 'Project permanently removed.' });
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Projects
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Organize, track, and collaborate on your team initiatives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewProjectOpen(true)}
            icon={Plus}
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#111418] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name or mission..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Dropdowns & View toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          <button
            onClick={() => setShowArchived(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showArchived
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-[#171A1F] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.08]'
            }`}
          >
            {showArchived ? 'Viewing Archived' : 'Active'}
          </button>

          {/* Grid / List View Toggle */}
          <div className="hidden sm:flex items-center gap-1 border border-slate-200/80 dark:border-white/[0.08] p-0.5 rounded-xl bg-slate-50 dark:bg-[#171A1F]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#111418] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#111418] text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="List view"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Projects Display */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-8">
          <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No projects found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery ? `No results matching "${searchQuery}".` : 'Create your first project to start planning deliverables with your team.'}
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsNewProjectOpen(true)} icon={Plus}>
            Create Project
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((project) => {
            const isArchived = Boolean(project.is_archived);
            const isOwner = project.user_role === 'Owner';

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] shadow-xs hover:shadow-card-hover dark:hover:shadow-dark-card p-5 space-y-4 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: project.color || '#4F46E5' }} 
                      />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {project.name}
                      </h3>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === project.id ? null : project.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === project.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-[#171A1F] rounded-xl shadow-elevated dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] py-1 z-50 animate-in fade-in duration-100 text-xs">
                            {isArchived ? (
                              <button
                                onClick={(e) => handleRestore(project.id, e)}
                                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 flex items-center gap-2"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleArchive(project.id, e)}
                                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 flex items-center gap-2"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Archive</span>
                              </button>
                            )}
                            {isOwner && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  setProjectToDelete(project.id);
                                }}
                                className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>Deliverables Progress</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-[#1F242C] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5">
                      <Badge priority={project.priority} size="xs" />
                      {isArchived && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#1F242C] text-slate-500">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {project.completed_tasks_count || 0}/{project.tasks_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-[#171A1F]/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
              <tr>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Tasks</th>
                <th className="py-3 px-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {filteredProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color || '#4F46E5' }} />
                    <span className="truncate">{project.name}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge status={project.status === 'Active' ? 'IN PROGRESS' : 'DONE'} size="xs">
                      {project.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge priority={project.priority} size="xs" />
                  </td>
                  <td className="py-3.5 px-4">
                    {project.completed_tasks_count || 0}/{project.tasks_count || 0}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                    {project.progress || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onProjectCreated={(newProj) => {
          navigate(`/projects/${newProj.id}`);
        }}
      />

      {/* Delete Project Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        title="Delete this project?"
        description="This will permanently delete the project and all associated tasks, files, and comments. This cannot be undone."
        confirmText="Delete Project"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setProjectToDelete(null)}
      />

    </div>
  );
};

export default Projects;

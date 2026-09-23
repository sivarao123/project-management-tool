import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  Calendar, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow, format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [projRes, tasksRes, actRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/my-tasks'),
          api.get('/activities/global')
        ]);

        if (projRes.projects) setProjects(projRes.projects);
        if (tasksRes.tasks) setUserTasks(tasksRes.tasks);
        if (actRes.activities) setActivities(actRes.activities);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Compute metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'Active' && !p.is_archived).length;
  const completedProjects = projects.filter(p => p.status === 'Completed' || p.progress === 100).length;

  const assignedTasks = userTasks.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksDueToday = userTasks.filter(t => t.due_date && t.due_date.split('T')[0] === todayStr && t.status !== 'DONE').length;
  const overdueTasks = userTasks.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr && t.status !== 'DONE').length;
  const completedTasks = userTasks.filter(t => t.status === 'DONE').length;

  // Task distribution calculations
  const priorityDistribution = {
    Urgent: userTasks.filter(t => t.priority === 'Urgent').length,
    High: userTasks.filter(t => t.priority === 'High').length,
    Medium: userTasks.filter(t => t.priority === 'Medium').length,
    Low: userTasks.filter(t => t.priority === 'Low').length,
  };

  const statusDistribution = {
    'BACKLOG': userTasks.filter(t => t.status === 'BACKLOG').length,
    'TODO': userTasks.filter(t => t.status === 'TODO').length,
    'IN PROGRESS': userTasks.filter(t => t.status === 'IN PROGRESS').length,
    'IN REVIEW': userTasks.filter(t => t.status === 'IN REVIEW').length,
    'DONE': completedTasks,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white rounded-full backdrop-blur-md">
              WORKSPACE OVERVIEW
            </span>
            <span className="text-xs text-indigo-200">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Developer'}! 👋
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
            Here is what's happening across your projects today. You have{' '}
            <strong className="text-white underline decoration-indigo-400 font-semibold">{tasksDueToday} tasks due today</strong> and{' '}
            <strong className="text-white underline decoration-rose-400 font-semibold">{overdueTasks} overdue tasks</strong>.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', metaKey: true }))}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            title="Open TaskFlow AI Copilot (⌘J)"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>AI Standup Briefing</span>
          </button>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Projects</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>My Tasks</span>
          </button>
        </div>

        {/* Decorative background glow circles */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Projects */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Projects</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderKanban className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalProjects}</p>
          <span className="text-[10px] text-slate-400 font-medium">In your workspace</span>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-600 mt-2">{activeProjects}</p>
          <span className="text-[10px] text-slate-400 font-medium">In progress boards</span>
        </div>

        {/* Completed Projects */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{completedProjects}</p>
          <span className="text-[10px] text-slate-400 font-medium">Delivered milestones</span>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{assignedTasks}</p>
          <span className="text-[10px] text-slate-400 font-medium">{completedTasks} finished</span>
        </div>

        {/* Due Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due Today</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{tasksDueToday}</p>
          <span className="text-[10px] text-slate-400 font-medium">Needs focus today</span>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{overdueTasks}</p>
          <span className="text-[10px] text-slate-400 font-medium">Past deadline</span>
        </div>
      </div>

      {/* Main Grid: Productivity Analytics & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Productivity Breakdown & Projects */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Productivity Overview Cards & Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Productivity Overview</h3>
                <p className="text-xs text-slate-400 mt-0.5">Task distribution across columns and urgency levels</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                {assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0}% Completion Rate
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Task completion progress</span>
                <span>{completedTasks} of {assignedTasks} tasks</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${assignedTasks > 0 ? (completedTasks / assignedTasks) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Visual Column Lanes & Priority Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* By Status */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">By Workflow Status</span>
                <div className="space-y-1.5">
                  {Object.entries(statusDistribution).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">{status}</span>
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Priority */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">By Priority Urgency</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent
                    </span>
                    <span className="font-bold text-rose-600 bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                      {priorityDistribution.Urgent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> High
                    </span>
                    <span className="font-bold text-amber-600 bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                      {priorityDistribution.High}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Medium
                    </span>
                    <span className="font-bold text-blue-600 bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                      {priorityDistribution.Medium}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Low
                    </span>
                    <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200/60 shadow-2xs">
                      {priorityDistribution.Low}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Active Projects</h3>
                <p className="text-xs text-slate-400 mt-0.5">Jump into project workspaces and Kanban boards</p>
              </div>
              <Link
                to="/projects"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="p-4 rounded-xl border border-slate-200/70 hover:border-indigo-300 hover:shadow-card bg-white transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: proj.color || '#4F46E5' }} 
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {proj.priority}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {proj.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {proj.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{proj.completed_tasks} of {proj.total_tasks} tasks done</span>
                      <span className="font-semibold text-slate-700">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${proj.progress}%`,
                          backgroundColor: proj.color || '#4F46E5'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Live Activity Stream */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live stream active" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-10">No recent team activities recorded.</p>
            ) : (
              activities.map((act) => {
                let timeAgo = 'recently';
                try {
                  if (act.created_at) {
                    timeAgo = formatDistanceToNow(new Date(act.created_at), { addSuffix: true });
                  }
                } catch {}

                return (
                  <div key={act.id} className="flex items-start gap-3 group">
                    <img
                      src={act.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user_name || 'U')}`}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">
                        <strong className="font-semibold text-slate-900">{act.user_name}</strong>{' '}
                        {act.action === 'created_project' && 'created project'}
                        {act.action === 'created_task' && 'created task'}
                        {act.action === 'moved_task' && (
                          <span>
                            moved <strong>{act.metadata?.title}</strong> to <span className="font-semibold text-indigo-600">{act.metadata?.to}</span>
                          </span>
                        )}
                        {act.action === 'added_comment' && 'commented on'}
                        {act.action === 'assigned_task' && (
                          <span>
                            assigned <strong>{act.metadata?.title}</strong> to {act.metadata?.assignee}
                          </span>
                        )}
                        {act.action === 'added_member' && (
                          <span>
                            added {act.metadata?.memberName} as {act.metadata?.role}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        <span>{act.project_name}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;

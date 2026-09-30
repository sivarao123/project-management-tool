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
  Sparkles,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MetricCardSkeleton, TableRowSkeleton } from '../components/common/Skeleton';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { formatDistanceToNow, format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTaskTab, setActiveTaskTab] = useState('all'); // 'all' | 'today' | 'high' | 'progress'

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

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Metrics computation
  const activeProjects = projects.filter(p => p.status === 'Active' && !p.is_archived).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const openTasks = userTasks.filter(t => t.status !== 'DONE').length;
  const tasksDueToday = userTasks.filter(t => t.due_date && t.due_date.split('T')[0] === todayStr && t.status !== 'DONE').length;
  const completedTasks = userTasks.filter(t => t.status === 'DONE').length;

  // Filtered tasks for main column
  const filteredTasks = userTasks.filter(t => {
    if (activeTaskTab === 'today') {
      return t.due_date && t.due_date.split('T')[0] === todayStr && t.status !== 'DONE';
    }
    if (activeTaskTab === 'high') {
      return (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'DONE';
    }
    if (activeTaskTab === 'progress') {
      return t.status === 'IN PROGRESS';
    }
    return true;
  });

  // Upcoming deadlines (next active tasks sorted by due date)
  const upcomingDeadlines = userTasks
    .filter(t => t.due_date && t.status !== 'DONE')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Workspace Overview
            </span>
            <span className="text-slate-300 dark:text-white/[0.15]">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Developer'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Here is a snapshot of your active priorities across your projects today.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('taskflow:open-copilot', {
                detail: { prompt: 'Generate daily standup report for active initiatives.' }
              }));
            }}
            icon={Sparkles}
          >
            AI Standup
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/projects')}
            icon={Plus}
          >
            Explore Projects
          </Button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            {/* Active Projects */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Projects</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{activeProjects}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">In your workspace</span>
            </div>

            {/* Open Tasks */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Open Tasks</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{openTasks}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Assigned to you</span>
            </div>

            {/* Due Today */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Due Today</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{tasksDueToday}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Require action</span>
            </div>

            {/* Completed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-slate-300 dark:hover:border-white/[0.14] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{completedTasks}</p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Finished tasks</span>
            </div>
          </>
        )}
      </div>

      {/* Two-Column Information Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
        
        {/* Main Column: My Tasks (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
            
            {/* Header & Filter Tabs */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  My Tasks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredTasks.length} tasks matching current view
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-[#171A1F] p-1 rounded-xl">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Due Today' },
                  { id: 'high', label: 'High Priority' },
                  { id: 'progress', label: 'In Progress' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTaskTab(tab.id)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTaskTab === tab.id
                        ? 'bg-white dark:bg-[#111418] text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Rows List */}
            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : filteredTasks.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No tasks in this view</p>
                  <p>You're all caught up on this filter.</p>
                </div>
              ) : (
                filteredTasks.slice(0, 8).map(task => {
                  const isOverdue = task.due_date && task.due_date.split('T')[0] < todayStr && task.status !== 'DONE';

                  return (
                    <div
                      key={task.id}
                      onClick={() => navigate(`/projects/${task.project_id}?task=${task.id}`)}
                      className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-white/[0.02] flex items-center justify-between gap-3.5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge priority={task.priority} dot size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: task.project_color || '#4F46E5' }} 
                            />
                            <span className="truncate">{task.project_name || 'Project'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {task.due_date && (
                          <div className={`hidden sm:flex items-center gap-1 text-[11px] ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          </div>
                        )}
                        <Badge status={task.status} size="xs" />
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View All Footer */}
            {filteredTasks.length > 8 && (
              <div className="p-3 bg-slate-50/60 dark:bg-[#171A1F]/40 border-t border-slate-100 dark:border-white/[0.06] text-center">
                <Link
                  to="/tasks"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>View all {filteredTasks.length} tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Column: Upcoming Deadlines & Recent Activity */}
        <div className="space-y-6">
          
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
              </div>
              <Link to="/calendar" className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                Calendar
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-12 rounded-xl" />
                  <div className="skeleton-shimmer h-12 rounded-xl" />
                </div>
              ) : upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  No upcoming deadlines this week.
                </p>
              ) : (
                upcomingDeadlines.map(task => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.project_id}?task=${task.id}`)}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.02] flex items-center justify-between gap-2.5 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {task.project_name}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shrink-0">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="space-y-2">
                  <div className="skeleton-shimmer h-10 rounded-xl" />
                  <div className="skeleton-shimmer h-10 rounded-xl" />
                </div>
              ) : activities.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  No activity recorded yet.
                </p>
              ) : (
                activities.slice(0, 5).map(act => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={act.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user_name || 'U')}`}
                      alt={act.user_name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-700 dark:text-slate-300 leading-snug">
                        <strong className="font-semibold text-slate-900 dark:text-white">{act.user_name}</strong>{' '}
                        {act.action}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Dashboard;

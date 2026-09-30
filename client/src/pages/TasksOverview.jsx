import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  MessageSquare,
  Paperclip,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';
import TaskModal from '../components/modals/TaskModal';
import Badge from '../components/common/Badge';
import { TableRowSkeleton } from '../components/common/Skeleton';
import { format } from 'date-fns';

const TasksOverview = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'due_today' | 'overdue' | 'completed'
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get('task');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let query = '';
      if (filter !== 'all') query += `?filter=${filter}`;
      if (priorityFilter !== 'All') query += `${query ? '&' : '?'}priority=${priorityFilter}`;

      const res = await api.get(`/tasks/my-tasks${query}`);
      if (res.tasks) {
        setTasks(res.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch user tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter, priorityFilter]);

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.project_name && t.project_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Assigned Tasks</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            All tasks currently assigned to you across all project workspaces.
          </p>
        </div>

        {/* Quick Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] rounded-xl shadow-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'due_today', label: 'Due Today' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filter === item.id
                  ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Priority Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111418] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title or project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#171A1F] text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-20 text-center space-y-2 p-6">
            <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">No tasks in this view</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You do not have any tasks matching the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50/80 dark:bg-[#171A1F]/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Task</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {filteredTasks.map((task) => {
                  const isOverdue = task.due_date && task.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && task.status !== 'DONE';

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSearchParams({ task: task.id })}
                      className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors max-w-sm truncate">
                        {task.title}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                            style={{ backgroundColor: task.project_color || '#4F46E5' }} 
                          />
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                            {task.project_name || 'Project'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge priority={task.priority} dot size="xs" />
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge status={task.status} size="xs" />
                      </td>

                      <td className="py-3.5 px-4">
                        {task.due_date ? (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-auto transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Details Drawer */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
          onTaskUpdated={() => fetchTasks()}
          onTaskDeleted={() => fetchTasks()}
        />
      )}

    </div>
  );
};

export default TasksOverview;

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
  Paperclip
} from 'lucide-react';
import api from '../services/api';
import TaskModal from '../components/modals/TaskModal';
import { format } from 'date-fns';

const PRIORITY_BADGES = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-50 text-blue-600',
  High: 'bg-amber-50 text-amber-700 font-semibold',
  Urgent: 'bg-rose-50 text-rose-700 font-bold',
};

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            <span>Assigned Tasks</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            All tasks currently assigned to you across all project boards.
          </p>
        </div>

        {/* Quick Filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-x-auto">
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
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Priority Controls */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or project name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading your tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">No tasks found</p>
          <p className="text-xs text-slate-400">You're all caught up for this filter criteria!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredTasks.map((task) => {
            const isOverdue = task.due_date && task.due_date.split('T')[0] < new Date().toISOString().split('T')[0] && task.status !== 'DONE';

            return (
              <div
                key={task.id}
                onClick={() => setSearchParams({ task: task.id })}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mt-0.5 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: task.project_color || '#4F46E5' }}
                      />
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        {task.project_name}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {task.title}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider ${PRIORITY_BADGES[task.priority]}`}>
                    {task.priority}
                  </span>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {task.status}
                  </span>

                  {task.due_date && (
                    <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(new Date(task.due_date), 'MMM d')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
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

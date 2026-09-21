import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  FolderKanban,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import TaskModal from '../components/modals/TaskModal';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from 'date-fns';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get('task');

  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        setLoading(true);
        const [projRes, taskRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks/my-tasks')
        ]);
        if (projRes.projects) setProjects(projRes.projects);
        if (taskRes.tasks) setTasks(taskRes.tasks);
      } catch (err) {
        console.error('Calendar load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

  // Compute days in month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getDayTasks = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return tasks.filter(t => t.due_date && t.due_date.split('T')[0] === dayStr);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            <span>Task Calendar</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track upcoming task milestones and deadlines visually.
          </p>
        </div>

        {/* Navigation month controls */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[120px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[550px]">
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isTodayDay = isToday(day);
            const dayTasks = getDayTasks(day);

            return (
              <div
                key={day.toISOString()}
                className={`p-2 min-h-[110px] flex flex-col transition-colors ${
                  isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-300'
                }`}
              >
                {/* Day number header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      isTodayDay
                        ? 'bg-indigo-600 text-white'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-300'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                {/* Day Task Badges */}
                <div className="flex-1 space-y-1 overflow-y-auto">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSearchParams({ task: task.id })}
                      className="p-1.5 rounded-lg border text-[11px] font-medium bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 cursor-pointer truncate transition-colors group flex items-center gap-1.5"
                      title={`${task.title} (${task.status})`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.project_color || '#4F46E5' }}
                      />
                      <span className="truncate group-hover:text-indigo-600 text-slate-700">
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
        />
      )}

    </div>
  );
};

export default CalendarPage;

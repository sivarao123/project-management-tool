import React, { useState, useEffect, useCallback } from 'react';
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
import Button from '../components/common/Button';
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

  const loadCalendarData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Task Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track upcoming task milestones and deadlines visually.
          </p>
        </div>

        {/* Navigation month controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>

          <div className="flex items-center gap-2 bg-white dark:bg-[#111418] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-[#171A1F]/50 text-center py-2.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-white/[0.06]">
          {calendarDays.map((day) => {
            const dayTasks = getDayTasks(day);
            const inCurrentMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[110px] sm:min-h-[130px] p-2 transition-colors flex flex-col justify-between ${
                  !inCurrentMonth 
                    ? 'bg-slate-50/40 dark:bg-white/[0.01] text-slate-300 dark:text-slate-600' 
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                } ${today ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      today
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : inCurrentMonth
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>

                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day Tasks List */}
                <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[75px]">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSearchParams({ task: t.id })}
                      className="px-2 py-1 rounded-md bg-white dark:bg-[#171A1F] border border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs text-[10px] font-medium text-slate-800 dark:text-slate-200 truncate cursor-pointer transition-all flex items-center gap-1.5 group"
                    >
                      <span 
                        className="w-1.5 h-1.5 rounded-full shrink-0" 
                        style={{ backgroundColor: t.project_color || '#4F46E5' }} 
                      />
                      <span className="truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {t.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Task Details Drawer */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => {
            searchParams.delete('task');
            setSearchParams(searchParams);
          }}
          onTaskUpdated={() => loadCalendarData()}
          onTaskDeleted={() => loadCalendarData()}
        />
      )}

    </div>
  );
};

export default CalendarPage;

import React from 'react';

const PRIORITY_MAP = {
  Urgent: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50',
    dot: 'bg-rose-500'
  },
  High: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50',
    dot: 'bg-amber-500'
  },
  Medium: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    dot: 'bg-blue-500'
  },
  Low: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-[#1F242C] dark:text-slate-300 dark:border-white/[0.08]',
    dot: 'bg-slate-400'
  }
};

const STATUS_MAP = {
  'BACKLOG': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1E232B] dark:text-slate-300 dark:border-white/[0.08]',
  'TODO': 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/40',
  'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
  'IN REVIEW': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40',
  'DONE': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
};

const Badge = ({
  children,
  priority,
  status,
  color,
  dot = false,
  size = 'sm',
  className = ''
}) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1F242C] dark:text-slate-300 dark:border-white/[0.08]';
  let dotColor = null;

  if (priority && PRIORITY_MAP[priority]) {
    styleClasses = PRIORITY_MAP[priority].bg;
    dotColor = PRIORITY_MAP[priority].dot;
  } else if (status && STATUS_MAP[status]) {
    styleClasses = STATUS_MAP[status];
  }

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-0.5 text-xs';

  if (color) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-semibold rounded-md border text-white ${sizeClasses} ${className}`}
        style={{ backgroundColor: color, borderColor: color }}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${styleClasses} ${sizeClasses} ${className}`}
    >
      {dot && dotColor && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children || priority || status}
    </span>
  );
};

export default Badge;

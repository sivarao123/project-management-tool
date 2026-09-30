import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton-shimmer rounded-md ${className}`} />
);

export const MetricCardSkeleton = () => (
  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="w-20 h-3.5" />
      <Skeleton className="w-6 h-6 rounded-lg" />
    </div>
    <Skeleton className="w-14 h-8" />
    <Skeleton className="w-28 h-3" />
  </div>
);

export const TaskCardSkeleton = () => (
  <div className="p-3.5 bg-white dark:bg-[#111418] rounded-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2.5">
    <div className="flex items-center gap-1.5">
      <Skeleton className="w-12 h-4 rounded-sm" />
      <Skeleton className="w-14 h-4 rounded-sm" />
    </div>
    <Skeleton className="w-full h-4" />
    <Skeleton className="w-3/4 h-3.5" />
    <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
      <Skeleton className="w-16 h-3" />
      <Skeleton className="w-5 h-5 rounded-full" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="p-4 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06]">
    <div className="flex items-center gap-3 flex-1">
      <Skeleton className="w-4 h-4 rounded-sm" />
      <div className="space-y-1.5 flex-1 max-w-md">
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
    </div>
    <Skeleton className="w-20 h-5 rounded-md" />
    <Skeleton className="w-16 h-5 rounded-md" />
    <Skeleton className="w-6 h-6 rounded-full" />
  </div>
);

export const ProjectCardSkeleton = () => (
  <div className="p-5 rounded-2xl bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </div>
      <Skeleton className="w-14 h-5 rounded-md" />
    </div>
    <Skeleton className="w-full h-10" />
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-8 h-3" />
      </div>
      <Skeleton className="w-full h-1.5 rounded-full" />
    </div>
  </div>
);

export default Skeleton;

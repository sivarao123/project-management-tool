import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, BellOff, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const NotificationsPage = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  // Group notifications into Today, Yesterday, and Older
  const todayNotifs = [];
  const yesterdayNotifs = [];
  const olderNotifs = [];

  notifications.forEach(n => {
    const date = new Date(n.created_at);
    if (isToday(date)) {
      todayNotifs.push(n);
    } else if (isYesterday(date)) {
      yesterdayNotifs.push(n);
    } else {
      olderNotifs.push(n);
    }
  });

  const renderNotifRow = (notif) => {
    let timeAgo = 'recently';
    try {
      if (notif.created_at) {
        timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });
      }
    } catch {}

    return (
      <div
        key={notif.id}
        onClick={() => handleNotificationClick(notif)}
        className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/[0.02] cursor-pointer group relative ${
          !notif.is_read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
        }`}
      >
        {!notif.is_read && (
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2 shrink-0" />
        )}

        <img
          src={notif.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.sender_name || 'T')}`}
          alt=""
          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] shrink-0"
        />

        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {notif.title}
            </h4>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">• {timeAgo}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notif.id);
            }}
            title="Delete notification"
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Notifications Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with assignments, mentions, status movements, and discussion replies.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            icon={CheckCheck}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications Grouped List */}
      <div className="space-y-6">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-2 bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] p-8">
            <BellOff className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">No notifications</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">You're completely caught up with your workspace.</p>
          </div>
        ) : (
          <>
            {todayNotifs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Today
                </span>
                <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                  {todayNotifs.map(renderNotifRow)}
                </div>
              </div>
            )}

            {yesterdayNotifs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Yesterday
                </span>
                <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                  {yesterdayNotifs.map(renderNotifRow)}
                </div>
              </div>
            )}

            {olderNotifs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  Earlier
                </span>
                <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
                  {olderNotifs.map(renderNotifRow)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;

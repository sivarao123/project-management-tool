import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, BellOff, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-600" />
            <span>Notifications Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay updated with assignments, mentions, status movements, and discussion replies.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <BellOff className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No notifications</p>
            <p className="text-xs text-slate-400">You're completely up to date.</p>
          </div>
        ) : (
          notifications.map((notif) => {
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
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-slate-50/80 cursor-pointer group relative ${
                  !notif.is_read ? 'bg-indigo-50/30' : ''
                }`}
              >
                {!notif.is_read && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                )}

                <img
                  src={notif.sender_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.sender_name || 'T')}`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">• {timeAgo}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    title="Delete notification"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;

import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Trash2, ExternalLink, BellOff } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    onClose();
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-[#171A1F] rounded-2xl shadow-elevated dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50/80 dark:bg-[#111418] border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
        {notifications.length === 0 ? (
          <div className="py-10 text-center px-4">
            <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No notifications yet</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">We'll alert you when tasks or comments update.</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notif) => {
            let timeAgo = 'recently';
            try {
              if (notif.created_at) {
                timeAgo = formatDistanceToNow(new Date(notif.created_at), { addSuffix: true });
              }
            } catch {}

            return (
              <div
                key={notif.id}
                className={`p-3.5 flex items-start gap-3 hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group relative ${
                  !notif.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                }`}
                onClick={() => handleItemClick(notif)}
              >
                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                )}
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-white/[0.1]">
                  {notif.sender_avatar ? (
                    <img src={notif.sender_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (notif.sender_name || 'T')[0]
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{timeAgo}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-3"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50/80 dark:bg-[#111418] border-t border-slate-100 dark:border-white/[0.06] text-center">
        <button
          onClick={() => {
            onClose();
            navigate('/notifications');
          }}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;

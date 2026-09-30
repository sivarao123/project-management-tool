import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const { isConnected } = useSocket();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all">
        <WifiOff className="w-3.5 h-3.5" />
        <span>You are currently offline. Changes will automatically sync when reconnected.</span>
      </div>
    );
  }

  if (showRestored) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all animate-in fade-in duration-200">
        <Wifi className="w-3.5 h-3.5" />
        <span>Internet connection restored. Real-time sync active.</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-slate-800 text-slate-300 dark:bg-[#1E232B] dark:text-slate-400 px-4 py-1 text-[11px] font-medium flex items-center justify-center gap-2">
        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
        <span>Reconnecting to real-time sync engine...</span>
      </div>
    );
  }

  return null;
};

export default OfflineBanner;

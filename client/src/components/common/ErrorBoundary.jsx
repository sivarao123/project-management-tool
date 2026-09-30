import React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TaskFlow Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0D10] text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#111418] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-xl p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-100 dark:border-rose-900/40">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                TaskFlow encountered an unexpected client error. Your data in the database remains safe.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#1F242C] dark:hover:bg-[#282F3A] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

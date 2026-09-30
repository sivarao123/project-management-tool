import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowRight, Lock, Mail, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const DEMO_ACCOUNTS = [
  {
    name: 'Alex Morgan',
    role: 'Lead Owner',
    email: 'alex@taskflow.dev',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
  },
  {
    name: 'Sarah Chen',
    role: 'Admin & Design',
    email: 'sarah@taskflow.dev',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300'
  },
  {
    name: 'John Doe',
    role: 'Full Stack Dev',
    email: 'john@taskflow.dev',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    badgeColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
  }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email or password is incorrect. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    try {
      setLoading(true);
      await login(acc.email, acc.password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0D10] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs mb-3">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome to TaskFlow
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Plan. Collaborate. Get Things Done.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#111418] py-8 px-6 sm:px-10 shadow-xs border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-6">
          
          {/* Quick Demo Login Selector */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#171A1F] rounded-xl border border-slate-200/60 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1-Click Quick Demo Sign In</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  disabled={loading}
                  className="p-2 bg-white dark:bg-[#1F242C] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-left transition-all hover:scale-102 flex flex-col items-center text-center group cursor-pointer"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-white/[0.1] mb-1"
                  />
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate w-full">{acc.name}</p>
                  <span className={`text-[9px] font-semibold px-1 py-0.2 rounded mt-0.5 truncate w-full ${acc.badgeColor}`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
              <span className="bg-white dark:bg-[#111418] px-3 text-slate-400 dark:text-slate-500">
                Or sign in with email
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@taskflow.dev"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full mt-2"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign in to workspace
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create one now
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ArrowLeft, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = request reset, 2 = set new password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { forgotPassword, resetPassword } = useAuth();

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setMessage(res.message || 'Reset link simulated. You can now set your new password below.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request password reset. Please check the email.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await resetPassword(email, newPassword);
      setMessage(res.message || 'Password successfully reset!');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0B0D10] text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs mb-3">
          <FolderKanban className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Reset your password
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          We'll help you regain access to your projects.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#111418] py-8 px-6 sm:px-10 shadow-xs rounded-2xl border border-slate-200/80 dark:border-white/[0.08] space-y-6">
          {message && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter account email
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

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={loading}
              >
                Send Reset Instructions
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={loading}
              >
                Update Password
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your password has been changed. You can now login.
              </p>
              <Link to="/login" className="inline-block">
                <Button variant="primary" size="sm">
                  Return to Login
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 text-center text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

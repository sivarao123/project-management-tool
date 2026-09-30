import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowRight, Lock, Mail, User, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password strength checks
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, bio });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to register account. Please verify your details.');
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
          Create your account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Start collaborating on initiatives in seconds.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-[#111418] py-8 px-6 sm:px-10 shadow-xs border border-slate-200/80 dark:border-white/[0.08] rounded-2xl space-y-6">
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Smith"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                />
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="mt-2 text-[10px] space-y-1 text-slate-400 dark:text-slate-500">
                  <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                    <Check className="w-3 h-3" />
                    <span>At least 8 characters recommended</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                    <Check className="w-3 h-3" />
                    <span>Contains uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}`}>
                    <Check className="w-3 h-3" />
                    <span>Contains number</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role or Specialization (Optional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Frontend Engineer, Product Designer"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
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
              Create free account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Register;

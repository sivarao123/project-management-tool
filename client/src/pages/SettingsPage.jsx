import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Button from '../components/common/Button';

const SettingsPage = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordErr, setPasswordErr] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileErr(null);
    try {
      setProfileSaving(true);
      await updateProfile({ name, bio, avatar_url: avatarUrl });
      setProfileMsg('Profile updated successfully!');
      showToast({ type: 'success', title: 'Profile Updated', message: 'Your personal information has been saved.' });
      setTimeout(() => setProfileMsg(null), 4000);
    } catch (err) {
      setProfileErr(err.message);
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordErr(null);

    if (newPassword.length < 6) {
      setPasswordErr('New password must be at least 6 characters.');
      return;
    }

    try {
      setPasswordSaving(true);
      await updatePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully!');
      showToast({ type: 'success', title: 'Security Updated', message: 'Your password was changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordMsg(null), 4000);
    } catch (err) {
      setPasswordErr(err.message);
      showToast({ type: 'error', title: 'Password Error', message: err.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Account Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal identity and security credentials.
        </p>
      </div>

      {/* 1. Personal Profile Form */}
      <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
          <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Profile</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Update your public identity across workspaces</p>
          </div>
        </div>

        {profileMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileMsg}</span>
          </div>
        )}

        {profileErr && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{profileErr}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-white/[0.1] shadow-xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-xs bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-xs bg-slate-100 dark:bg-[#1F242C] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Role / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your team about your discipline, skills, or responsibilities..."
              className="w-full text-xs bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl p-3 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="sm" isLoading={profileSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* 2. Security Credentials Form */}
      <div className="bg-white dark:bg-[#111418] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3.5">
          <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security & Password</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">Change your password to secure your account</p>
          </div>
        </div>

        {passwordMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordMsg}</span>
          </div>
        )}

        {passwordErr && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordErr}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                className="w-full text-xs bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="secondary" size="sm" isLoading={passwordSaving}>
              Update Password
            </Button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default SettingsPage;

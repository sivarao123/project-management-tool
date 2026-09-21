import React, { useState, useEffect } from 'react';
import { Users, Mail, FolderKanban, CheckSquare, Plus, Search } from 'lucide-react';
import api from '../services/api';

const TeamPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users');
        if (res.users) setUsers(res.users);
      } catch (err) {
        console.error('Failed to fetch team members:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.bio && u.bio.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Team & Collaborators</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Meet the innovators, managers, and developers driving TaskFlow projects.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search colleagues..."
            className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading team directory...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-card p-5 space-y-4 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                  alt=""
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{member.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {member.role || 'Member'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{member.email}</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/60 p-2.5 rounded-xl">
                {member.bio || 'Productive collaborator at TaskFlow.'}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-500">
                <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                  <span><strong>{member.project_count || 1}</strong> projects</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                  <span><strong>{member.active_tasks_count || 0}</strong> active tasks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default TeamPage;

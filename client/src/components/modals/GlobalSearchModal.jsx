import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, Users, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], members: [], comments: [] });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], members: [], comments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], members: [], comments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.results) {
          setResults(res.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.projects.length + results.tasks.length + results.members.length + results.comments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, members, or comments..."
            className="w-full bg-transparent text-slate-900 text-sm focus:outline-hidden placeholder:text-slate-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!query.trim() && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-500">Quick Global Search</p>
              <p className="mt-1">Type keywords to search across projects, task titles, team members, and discussion threads.</p>
            </div>
          )}

          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-600">No results found for "{query}"</p>
              <p className="mt-1">Try adjusting your spelling or search terms.</p>
            </div>
          )}

          {/* Projects Results */}
          {results.projects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <FolderKanban className="w-3.5 h-3.5 text-indigo-500" />
                <span>Projects ({results.projects.length})</span>
              </div>
              <div className="space-y-1">
                {results.projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onClose();
                      navigate(`/projects/${proj.id}`);
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj.color || '#4F46E5' }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {proj.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{proj.description || 'No description'}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tasks ({results.tasks.length})</span>
              </div>
              <div className="space-y-1">
                {results.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onClose();
                      navigate(`/projects/${task.project_id}?task=${task.id}`);
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {task.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        In <span className="font-medium text-slate-600">{task.project_name}</span>
                        {task.assignee_name && ` • Assigned to ${task.assignee_name}`}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Results */}
          {results.members.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5 text-sky-500" />
                <span>Team Members ({results.members.length})</span>
              </div>
              <div className="space-y-1">
                {results.members.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => {
                      onClose();
                      navigate('/team');
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      {member.role || 'Member'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Results */}
          {results.comments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>Discussions ({results.comments.length})</span>
              </div>
              <div className="space-y-1">
                {results.comments.map((comm) => (
                  <div
                    key={comm.id}
                    onClick={() => {
                      onClose();
                      navigate(`/projects/${comm.project_id}?task=${comm.task_id}`);
                    }}
                    className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors"
                  >
                    <p className="text-xs text-slate-700 line-clamp-1 italic">
                      "{comm.content}"
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      By <span className="font-semibold text-slate-600">{comm.author_name}</span> on task{' '}
                      <span className="font-semibold text-indigo-600">{comm.task_title}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or arrow keys</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

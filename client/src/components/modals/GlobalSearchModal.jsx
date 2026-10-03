import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, CheckSquare, Users, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import api from '../../services/api';

const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], members: [], comments: [] });
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const triggerElementRef = useRef(null);
  const selectedRef = useRef(null);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const flatItemsRef = useRef([]);

  const navigate = useNavigate();

  const handleClose = () => {
    setQuery('');
    setResults({ projects: [], tasks: [], members: [], comments: [] });
    setSelectedIndex(-1);
    onClose?.();
    if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
      triggerElementRef.current.focus();
    }
  };

  // Populate flat actions list for keyboard navigation
  flatItemsRef.current = [
    ...results.projects.map((proj) => () => {
      handleClose();
      navigate(`/projects/${proj.id}`);
    }),
    ...results.tasks.map((task) => () => {
      handleClose();
      navigate(`/projects/${task.project_id}?task=${task.id}`);
    }),
    ...results.members.map((member) => () => {
      handleClose();
      navigate('/team');
    }),
    ...results.comments.map((comm) => () => {
      handleClose();
      navigate(`/projects/${comm.project_id}?task=${comm.task_id}`);
    })
  ];

  // Capture trigger element and manage focus / state on open/close
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement;
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], members: [], comments: [] });
      setSelectedIndex(-1);
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Scroll active item into view during arrow-key navigation
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keydown listener active ONLY while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      const total = flatItemsRef.current.length;
      if (total > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
        } else if (e.key === 'Enter') {
          const currentIdx = selectedIndexRef.current;
          if (currentIdx >= 0 && flatItemsRef.current[currentIdx]) {
            e.preventDefault();
            flatItemsRef.current[currentIdx]();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounced search query
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
  let itemIndexCounter = 0;

  return (
    <div 
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
      >
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
            <button 
              type="button"
              onClick={() => setQuery('')} 
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded cursor-pointer transition-colors"
            title="Press ESC to close"
            aria-label="Close search"
          >
            ESC
          </button>
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
                {results.projects.map((proj) => {
                  const currentIndex = itemIndexCounter++;
                  const isSelected = selectedIndex === currentIndex;
                  return (
                    <div
                      key={proj.id}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => {
                        handleClose();
                        navigate(`/projects/${proj.id}`);
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer group transition-colors ${
                        isSelected ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: proj.color || '#4F46E5' }} />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate transition-colors ${
                            isSelected ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'
                          }`}>
                            {proj.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{proj.description || 'No description'}</p>
                        </div>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 transition-all ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  );
                })}
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
                {results.tasks.map((task) => {
                  const currentIndex = itemIndexCounter++;
                  const isSelected = selectedIndex === currentIndex;
                  return (
                    <div
                      key={task.id}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => {
                        handleClose();
                        navigate(`/projects/${task.project_id}?task=${task.id}`);
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer group transition-colors ${
                        isSelected ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold truncate transition-colors ${
                            isSelected ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'
                          }`}>
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
                      <ArrowRight className={`w-3.5 h-3.5 transition-all ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5'
                      }`} />
                    </div>
                  );
                })}
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
                {results.members.map((member) => {
                  const currentIndex = itemIndexCounter++;
                  const isSelected = selectedIndex === currentIndex;
                  return (
                    <div
                      key={member.id}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => {
                        handleClose();
                        navigate('/team');
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer group transition-colors ${
                        isSelected ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate transition-colors ${
                            isSelected ? 'text-indigo-600' : 'text-slate-800 group-hover:text-indigo-600'
                          }`}>
                            {member.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {member.role || 'Member'}
                      </span>
                    </div>
                  );
                })}
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
                {results.comments.map((comm) => {
                  const currentIndex = itemIndexCounter++;
                  const isSelected = selectedIndex === currentIndex;
                  return (
                    <div
                      key={comm.id}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => {
                        handleClose();
                        navigate(`/projects/${comm.project_id}?task=${comm.task_id}`);
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`p-2.5 rounded-lg cursor-pointer group transition-colors ${
                        isSelected ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-xs text-slate-700 line-clamp-1 italic">
                        "{comm.content}"
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        By <span className="font-semibold text-slate-600">{comm.author_name}</span> on task{' '}
                        <span className="font-semibold text-indigo-600">{comm.task_title}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with mouse or arrow keys</span>
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-slate-600 cursor-pointer transition-colors"
          >
            Press ESC to close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  FolderKanban, 
  CheckSquare, 
  Users, 
  Calendar, 
  Settings, 
  LayoutDashboard, 
  Plus, 
  Sun, 
  Moon, 
  ArrowRight, 
  CornerDownLeft, 
  Loader2 
} from 'lucide-react';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const GlobalSearchModal = ({ isOpen, onClose, onOpenNewTask, onOpenNewProject }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ projects: [], tasks: [], members: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Preset quick commands
  const defaultCommands = [
    {
      id: 'cmd-new-task',
      title: 'Create new task',
      category: 'Actions',
      shortcut: '⌘T',
      icon: Plus,
      action: () => {
        onClose();
        onOpenNewTask?.();
      }
    },
    {
      id: 'cmd-new-project',
      title: 'Create new project',
      category: 'Actions',
      shortcut: '⌘P',
      icon: FolderKanban,
      action: () => {
        onClose();
        onOpenNewProject?.();
      }
    },
    {
      id: 'cmd-theme',
      title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      category: 'Preferences',
      shortcut: '⌘D',
      icon: isDark ? Sun : Moon,
      action: () => {
        toggleTheme();
        onClose();
      }
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => {
        navigate('/');
        onClose();
      }
    },
    {
      id: 'nav-projects',
      title: 'Go to Projects',
      category: 'Navigation',
      icon: FolderKanban,
      action: () => {
        navigate('/projects');
        onClose();
      }
    },
    {
      id: 'nav-tasks',
      title: 'Go to Tasks Overview',
      category: 'Navigation',
      icon: CheckSquare,
      action: () => {
        navigate('/tasks');
        onClose();
      }
    },
    {
      id: 'nav-calendar',
      title: 'Go to Calendar',
      category: 'Navigation',
      icon: Calendar,
      action: () => {
        navigate('/calendar');
        onClose();
      }
    },
    {
      id: 'nav-team',
      title: 'Go to Team Directory',
      category: 'Navigation',
      icon: Users,
      action: () => {
        navigate('/team');
        onClose();
      }
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        navigate('/settings');
        onClose();
      }
    }
  ];

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], members: [] });
    }
  }, [isOpen]);

  // Debounced API search when typing
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], members: [] });
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        if (res.results) {
          setResults({
            projects: res.results.projects || [],
            tasks: res.results.tasks || [],
            members: res.results.members || []
          });
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error('Command palette search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Build flattened selectable list
  const activeItems = [];

  if (!query.trim()) {
    // Show default quick commands
    activeItems.push(...defaultCommands);
  } else {
    // Show matching commands first
    const matchedCommands = defaultCommands.filter(c =>
      c.title.toLowerCase().includes(query.toLowerCase())
    );
    activeItems.push(...matchedCommands);

    // Show matching projects
    results.projects.forEach(p => {
      activeItems.push({
        id: `proj-${p.id}`,
        title: p.name,
        subtitle: p.description || 'Project workspace',
        category: 'Projects',
        icon: FolderKanban,
        badge: p.status,
        color: p.color,
        action: () => {
          navigate(`/projects/${p.id}`);
          onClose();
        }
      });
    });

    // Show matching tasks
    results.tasks.forEach(t => {
      activeItems.push({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `${t.project_name || 'Project'} • ${t.status}`,
        category: 'Tasks',
        icon: CheckSquare,
        priority: t.priority,
        action: () => {
          navigate(`/projects/${t.project_id}?task=${t.id}`);
          onClose();
        }
      });
    });

    // Show matching members
    results.members.forEach(m => {
      activeItems.push({
        id: `member-${m.id}`,
        title: m.name,
        subtitle: m.email,
        category: 'People',
        icon: Users,
        badge: m.role,
        action: () => {
          navigate('/team');
          onClose();
        }
      });
    });
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < activeItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : activeItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeItems[selectedIndex]) {
          activeItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#111418] rounded-2xl shadow-2xl dark:shadow-dark-elevated border border-slate-200/90 dark:border-white/[0.08] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-3 bg-slate-50/50 dark:bg-[#171A1F]/50">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search anything..."
            className="w-full bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin shrink-0" />}
          {query && (
            <button 
              onClick={() => setQuery('')} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-[#171A1F] border border-slate-200 dark:border-white/[0.08] rounded">
            ESC
          </kbd>
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          {activeItems.length === 0 && !loading && (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              <p className="font-semibold text-slate-600 dark:text-slate-300">No results found for "{query}"</p>
              <p className="mt-1">Try another keyword or shortcut.</p>
            </div>
          )}

          {activeItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`
                  flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm cursor-pointer transition-all
                  ${isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isSelected 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300' 
                      : 'bg-slate-100 dark:bg-[#1F242C] border-slate-200/60 dark:border-white/[0.06] text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.color ? (
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{item.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1F242C] text-slate-600 dark:text-slate-400">
                      {item.badge}
                    </span>
                  )}
                  {item.shortcut ? (
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-[#171A1F] border border-slate-200 dark:border-white/[0.08] rounded shadow-2xs">
                      {item.shortcut}
                    </kbd>
                  ) : isSelected ? (
                    <CornerDownLeft className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Command Palette Footer */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#171A1F]/40 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-semibold text-slate-500 dark:text-slate-400">↑↓</kbd> Navigate</span>
            <span><kbd className="font-semibold text-slate-500 dark:text-slate-400">↵</kbd> Select</span>
            <span><kbd className="font-semibold text-slate-500 dark:text-slate-400">ESC</kbd> Close</span>
          </div>
          <span>TaskFlow Command Palette</span>
        </div>

      </div>
    </div>
  );
};

export default GlobalSearchModal;

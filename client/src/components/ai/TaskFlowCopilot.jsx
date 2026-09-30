import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
  Check,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const QUICK_PROMPTS = [
  { label: '📊 Sprint Health & Bottlenecks', prompt: 'Analyze current sprint health, overdue tasks, and blockers.' },
  { label: '🚀 Break Down New Feature', prompt: 'Break down payment checkout flow into sprint user stories.' },
  { label: '⚖️ Balance Team Workload', prompt: 'Evaluate team workload and recommend task reassignments.' },
  { label: '📝 Daily Standup Summary', prompt: 'Generate daily standup report for active initiatives.' }
];

const TaskFlowCopilot = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm **TaskFlow Copilot (Nova)**, your autonomous AI project coordinator.\n\nI can decompose features into sprint stories, audit team velocity, detect bottlenecks, and balance workload across collaborators. How can I help today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setAllProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedActions, setSelectedActions] = useState(new Set());
  const [executingActions, setExecutingActions] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Determine current active project from URL if on /projects/:id
  useEffect(() => {
    const match = location.pathname.match(/\/projects\/(\d+)/);
    if (match) {
      setSelectedProjectId(match[1]);
    }
  }, [location.pathname]);

  // Fetch available projects for selector
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        if (res.projects) {
          setAllProjects(res.projects);
          if (!selectedProjectId && res.projects.length > 0) {
            setSelectedProjectId(String(res.projects[0].id));
          }
        }
      } catch (err) {
        console.error('Failed to load projects for AI Copilot:', err);
      }
    };
    if (user) fetchProjects();
  }, [user]);

  // Keyboard shortcut listener (Cmd+J or Ctrl+J) & Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessageRef = useRef();
  // Keep handleSendMessageRef updated on render

  // Custom event listener from Dashboard or other pages
  useEffect(() => {
    const handleCustomOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSendMessageRef.current?.(e.detail.prompt);
      }
    };
    window.addEventListener('taskflow:open-copilot', handleCustomOpen);
    return () => window.removeEventListener('taskflow:open-copilot', handleCustomOpen);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (promptToSend) => {
    const query = (promptToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMsg = {
      id: userMessageId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);
    setActionSuccessMsg('');

    try {
      const res = await api.post('/ai/agent', {
        prompt: query,
        projectId: selectedProjectId ? Number(selectedProjectId) : null
      });

      const agentMsgId = `agent-${Date.now()}`;
      const actionItems = res.actions || [];

      // Pre-select all proposed actions
      const newActionSet = new Set(actionItems.map((_, idx) => `${agentMsgId}-${idx}`));
      setSelectedActions(newActionSet);

      const agentMsg = {
        id: agentMsgId,
        sender: 'agent',
        text: res.response,
        thoughts: res.thoughts || [],
        actions: actionItems,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          isError: true,
          text: `⚠️ **Agent processing paused**: ${err.message || 'Unable to connect to AI engine.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  handleSendMessageRef.current = handleSendMessage;

  // Execute selected actions directly into PostgreSQL
  const handleExecuteActions = async (messageId, actions) => {
    const targetProject = selectedProjectId || (projects.length > 0 ? String(projects[0].id) : null);
    if (!targetProject) {
      showToast({
        type: 'warning',
        title: 'Project Required',
        message: 'Please select a project before applying actions.'
      });
      return;
    }

    try {
      setExecutingActions(true);
      const res = await api.post('/ai/execute-actions', {
        projectId: Number(targetProject),
        actions
      });

      setActionSuccessMsg(`✅ Successfully executed ${res.executedCount} action(s) into database!`);
      showToast({
        type: 'success',
        title: 'Actions Executed',
        message: `Successfully executed ${res.executedCount} action(s) into database!`
      });

      // Update message actions as executed
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, actionsExecuted: true };
          }
          return msg;
        })
      );

      // If user is currently on that project page, tasks will update in real time via Socket.io!
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Execution Failed',
        message: `Failed to execute actions: ${err.message}`
      });
    } finally {
      setExecutingActions(false);
    }
  };

  const currentProjectName = projects.find(p => String(p.id) === String(selectedProjectId))?.name || 'All Workspace';

  return (
    <>
      {/* Floating Agent Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-semibold text-xs rounded-2xl shadow-xl hover:shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-4 ring-indigo-500/20"
          title="Open TaskFlow AI Agent (Cmd+J)"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="tracking-wide">TaskFlow AI Copilot</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono">
            ⌘J
          </span>
        </button>
      )}

      {/* Slide-over Copilot Drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            className={`bg-white dark:bg-[#111418] h-full shadow-2xl border-l border-slate-200/80 dark:border-white/[0.08] flex flex-col transition-all duration-300 text-slate-900 dark:text-slate-100 ${
              isExpanded ? 'w-full md:w-[720px]' : 'w-full sm:w-[460px]'
            }`}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold tracking-tight">TaskFlow Copilot</h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                      Nova AI Agent
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Autonomous Project Coordinator</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title={isExpanded ? 'Collapse' : 'Expand width'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Context Selector Bar */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#171A1F] border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                  Target Project:
                </span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 truncate max-w-[220px]"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                Gemini 3.8 / Fallback Ready
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 px-1">
                    {msg.sender === 'user' ? (
                      <>
                        <span>You</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">TaskFlow Agent</span>
                        {msg.source && (
                          <span className="text-[9px] bg-slate-100 dark:bg-[#171A1F] text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-mono">
                            {msg.source}
                          </span>
                        )}
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl max-w-[90%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white font-medium rounded-tr-xs shadow-xs'
                        : msg.isError
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900/50 rounded-tl-xs'
                        : 'bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {/* Collapsible Thoughts Accordion */}
                    {msg.thoughts && msg.thoughts.length > 0 && (
                      <ThoughtProcessAccordion thoughts={msg.thoughts} />
                    )}

                    {/* Markdown Formatted Body */}
                    <div className="whitespace-pre-line prose-xs">
                      {msg.text}
                    </div>

                    {/* Action Cards (if proposed by agent) */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Proposed Actions ({msg.actions.length})</span>
                          </span>
                          {!msg.actionsExecuted ? (
                            <button
                              onClick={() => handleExecuteActions(msg.id, msg.actions)}
                              disabled={executingActions}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{executingActions ? 'Executing...' : 'Apply to Board'}</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                              <CheckCircle2 className="w-3 h-3" /> Applied to Board
                            </span>
                          )}
                        </div>

                        {/* Action items list */}
                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {msg.actions.map((act, actIdx) => (
                            <div
                              key={actIdx}
                              className="p-2.5 rounded-xl bg-white dark:bg-[#111418] border border-slate-200/90 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-indigo-600 transition-all space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                                  {act.title || act.reason || 'Action Item'}
                                </span>
                                {act.priority && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      act.priority === 'Urgent'
                                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                        : act.priority === 'High'
                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                                        : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                                    }`}
                                  >
                                    {act.priority}
                                  </span>
                                )}
                              </div>
                              {act.description && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {act.description.replace(/###/g, '')}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                                <span>Column: <strong>{act.status || 'TODO'}</strong></span>
                                {act.due_in_days && <span>Target: ~{act.due_in_days} days</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator with thought step */}
              {loading && (
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 animate-in fade-in">
                  <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                  </div>
                  <div className="bg-slate-50 dark:bg-[#171A1F] border border-slate-200/80 dark:border-white/[0.08] p-3.5 rounded-2xl rounded-tl-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Agent Reasoning in Progress...</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Querying PostgreSQL project state, evaluating dependencies & synthesizing action plan...
                    </p>
                  </div>
                </div>
              )}

              {/* Action Success Alert */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{actionSuccessMsg}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${selectedProjectId}`)}
                    className="text-xs font-bold text-emerald-700 dark:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Board</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Pills */}
            <div className="px-4 py-2 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#171A1F] overflow-x-auto no-scrollbar flex items-center gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.prompt)}
                  disabled={loading}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white dark:bg-[#111418] border border-slate-200/80 dark:border-white/[0.08] hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition-all cursor-pointer"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 border-t border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#111418] flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={`Ask Copilot about "${currentProjectName}" or command actions...`}
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl bg-slate-50/50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !inputPrompt.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send instruction"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Collapsible Agent Thought Process Accordion
const ThoughtProcessAccordion = ({ thoughts }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden text-[11px]">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full px-3 py-1.5 flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Agent Reasoning Trace ({thoughts.length} steps)</span>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="p-3 pt-1 space-y-2 border-t border-indigo-100/70 dark:border-indigo-900/50 bg-white/60 dark:bg-[#111418]/60">
          {thoughts.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2 text-[10px]">
              <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">{step.title}</p>
                {step.detail && <p className="text-slate-500 dark:text-slate-400 text-[9px]">{step.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFlowCopilot;

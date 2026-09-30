import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Layers,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Plus,
  Loader2,
  Calendar,
  Check
} from 'lucide-react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

const SprintAIAssistantModal = ({ isOpen, onClose, projectId, projectName, onTasksCreated }) => {
  const { showToast } = useNotifications();
  const [activeTab, setActiveTab] = useState('decompose'); // 'decompose' | 'health' | 'workload'

  // Feature Decomposer State
  const [featurePrompt, setFeaturePrompt] = useState('');
  const [targetColumn, setTargetColumn] = useState('TODO');
  const [decomposing, setDecomposing] = useState(false);
  const [decomposedActions, setDecomposedActions] = useState([]);
  const [selectedDecomposed, setSelectedDecomposed] = useState(new Set());
  const [applyingTasks, setApplyingTasks] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Health State
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Workload State
  const [workloadData, setWorkloadData] = useState(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  const [applyingRebalance, setApplyingRebalance] = useState(false);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load health data
  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      const res = await api.post('/ai/standup', { projectId: Number(projectId) });
      if (res.success) {
        setHealthData(res);
      }
    } catch (err) {
      console.error('Failed to fetch sprint health:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  // Load workload data
  const fetchWorkload = async () => {
    try {
      setLoadingWorkload(true);
      const res = await api.post('/ai/agent', {
        prompt: 'Evaluate team workload and recommend task reassignments.',
        projectId: Number(projectId)
      });
      if (res.success) {
        setWorkloadData(res);
      }
    } catch (err) {
      console.error('Failed to fetch workload data:', err);
    } finally {
      setLoadingWorkload(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      if (activeTab === 'health' && !healthData) fetchHealth();
      if (activeTab === 'workload' && !workloadData) fetchWorkload();
    }
  }, [isOpen, activeTab, projectId]);

  // Handle Feature Decomposition
  const handleDecompose = async (e) => {
    e.preventDefault();
    if (!featurePrompt.trim()) return;

    try {
      setDecomposing(true);
      setApplySuccess(false);

      const res = await api.post('/ai/breakdown', {
        prompt: featurePrompt.trim(),
        projectId: Number(projectId)
      });

      if (res.actions) {
        const actionsWithCol = res.actions.map(a => ({ ...a, status: targetColumn }));
        setDecomposedActions(actionsWithCol);
        setSelectedDecomposed(new Set(actionsWithCol.map((_, i) => i)));
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Breakdown Failed', message: err.message });
    } finally {
      setDecomposing(false);
    }
  };

  // Apply decomposed tasks to PostgreSQL
  const handleApplyDecomposed = async () => {
    const toApply = decomposedActions.filter((_, i) => selectedDecomposed.has(i));
    if (toApply.length === 0) return;

    try {
      setApplyingTasks(true);
      await api.post('/ai/execute-actions', {
        projectId: Number(projectId),
        actions: toApply
      });

      setApplySuccess(true);
      showToast({ type: 'success', title: 'Tasks Created', message: `Added ${toApply.length} task(s) to board.` });
      if (onTasksCreated) onTasksCreated();

      setTimeout(() => {
        setApplySuccess(false);
        setDecomposedActions([]);
        setFeaturePrompt('');
      }, 3000);
    } catch (err) {
      showToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setApplyingTasks(false);
    }
  };

  // Apply Workload Rebalance recommendations
  const handleApplyRebalance = async () => {
    if (!workloadData?.actions || workloadData.actions.length === 0) return;

    try {
      setApplyingRebalance(true);
      await api.post('/ai/execute-actions', {
        projectId: Number(projectId),
        actions: workloadData.actions
      });

      showToast({ type: 'success', title: 'Workload Rebalanced', message: 'Tasks successfully reassigned across team.' });
      fetchWorkload();
      if (onTasksCreated) onTasksCreated();
    } catch (err) {
      showToast({ type: 'error', title: 'Rebalance Failed', message: err.message });
    } finally {
      setApplyingRebalance(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#111418] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/[0.08] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">AI Sprint Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-indigo-200 font-mono">
                  {projectName}
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous feature decomposition, sprint health & workload balancing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#171A1F] px-6 gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <button
            onClick={() => setActiveTab('decompose')}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'decompose'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-[#111418]'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Feature Decomposition</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('health');
              fetchHealth();
            }}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-[#111418]'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sprint Health & Risks</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workload');
              fetchWorkload();
            }}
            className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'workload'
                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-[#111418]'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workload Balancer</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          
          {/* TAB 1: FEATURE DECOMPOSITION */}
          {activeTab === 'decompose' && (
            <div className="space-y-4">
              <form onSubmit={handleDecompose} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    What initiative or epic would you like to break down?
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={featurePrompt}
                      onChange={(e) => setFeaturePrompt(e.target.value)}
                      placeholder="e.g. Stripe checkout with webhooks, coupon codes, and PDF receipt downloads"
                      className="flex-1 px-3.5 py-2.5 text-xs font-medium border border-slate-200/80 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-400"
                    />
                    <select
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                      className="px-3 py-2.5 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] rounded-xl bg-slate-50 dark:bg-[#171A1F] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="TODO">Target: TODO</option>
                      <option value="BACKLOG">Target: BACKLOG</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Agent generates 4 sprint tasks with acceptance criteria</span>
                  </div>
                  <button
                    type="submit"
                    disabled={decomposing || !featurePrompt.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {decomposing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Decomposing Scope...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate User Stories</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Success Notification */}
              {applySuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Tasks created successfully on the board!</span>
                </div>
              )}

              {/* Decomposed Tasks Cards */}
              {decomposedActions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Generated Sprint Stories ({selectedDecomposed.size}/{decomposedActions.length} selected)
                    </span>
                    <button
                      onClick={handleApplyDecomposed}
                      disabled={applyingTasks || selectedDecomposed.size === 0}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      {applyingTasks ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Creating on Board...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Add Selected ({selectedDecomposed.size}) to Board</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {decomposedActions.map((task, idx) => {
                      const isSelected = selectedDecomposed.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedDecomposed(prev => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx);
                              else next.add(idx);
                              return next;
                            });
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/20'
                              : 'bg-white dark:bg-[#171A1F] border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 pointer-events-none"
                              />
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs">{task.title}</h4>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                task.priority === 'Urgent'
                                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 whitespace-pre-line pl-6 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPRINT HEALTH & RISKS */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              {loadingHealth ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Auditing sprint telemetry & velocity...</span>
                </div>
              ) : healthData ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#171A1F] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                    {healthData.summary}
                  </div>

                  {healthData.actions && healthData.actions.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-300 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Recommended Corrective Actions ({healthData.actions.length})</span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        The agent detected overdue cards and recommends flagging their priority to Urgent.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-center py-10">Click tab to evaluate sprint health.</p>
              )}
            </div>
          )}

          {/* TAB 3: WORKLOAD BALANCER */}
          {activeTab === 'workload' && (
            <div className="space-y-4">
              {loadingWorkload ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Analyzing team capacity distributions...</span>
                </div>
              ) : workloadData ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#171A1F] rounded-2xl border border-slate-200/80 dark:border-white/[0.08] whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                    {workloadData.response}
                  </div>

                  {workloadData.actions && workloadData.actions.length > 0 && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-white/[0.08]">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                        {workloadData.actions.length} Reassignment(s) Recommended
                      </span>
                      <button
                        onClick={handleApplyRebalance}
                        disabled={applyingRebalance}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        {applyingRebalance ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Rebalancing...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Apply Recommended Rebalancing</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 dark:text-slate-500 text-center py-10">Click tab to load team workload analysis.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintAIAssistantModal;

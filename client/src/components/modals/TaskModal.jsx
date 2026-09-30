import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  User, 
  Tag, 
  Paperclip, 
  MessageSquare, 
  Activity, 
  Trash2, 
  Send, 
  Edit3, 
  Check, 
  Download, 
  Plus, 
  AlertCircle,
  CornerDownRight,
  Loader2,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import Badge from '../common/Badge';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDistanceToNow, format } from 'date-fns';

const COLUMNS = ['BACKLOG', 'TODO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const TaskModal = ({ taskId, onClose, onTaskUpdated, onTaskDeleted, projectMembers = [], projectLabels = [] }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotifications();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

  // Confirm delete dialog state
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Editable fields state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // File upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isConfirmDeleteOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isConfirmDeleteOpen]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tasks/${taskId}`);
      if (res.task) {
        setTask(res.task);
        setTitle(res.task.title);
        setDescription(res.task.description || '');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  // Real-time socket events
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleTaskUpdated = (updatedTask) => {
      if (updatedTask.id === Number(taskId)) {
        setTask(prev => ({
          ...prev,
          ...updatedTask,
          comments: prev?.comments || [],
          attachments: prev?.attachments || [],
          activities: prev?.activities || []
        }));
        setTitle(updatedTask.title);
        setDescription(updatedTask.description || '');
      }
    };

    const handleCommentCreated = ({ taskId: cTaskId, comment }) => {
      if (cTaskId === Number(taskId)) {
        setTask(prev => {
          if (!prev) return prev;
          const exists = prev.comments?.some(c => c.id === comment.id);
          if (exists) return prev;
          return {
            ...prev,
            comments: [...(prev.comments || []), comment]
          };
        });
      }
    };

    const handleCommentDeleted = ({ taskId: cTaskId, commentId }) => {
      if (cTaskId === Number(taskId)) {
        setTask(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments?.filter(c => c.id !== commentId) || []
          };
        });
      }
    };

    const handleAttachmentUploaded = ({ taskId: aTaskId, attachment }) => {
      if (aTaskId === Number(taskId)) {
        setTask(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attachments: [attachment, ...(prev.attachments || [])]
          };
        });
      }
    };

    const handleAttachmentDeleted = ({ taskId: aTaskId, attachmentId }) => {
      if (aTaskId === Number(taskId)) {
        setTask(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attachments: prev.attachments?.filter(a => a.id !== attachmentId) || []
          };
        });
      }
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);
    socket.on('attachment:uploaded', handleAttachmentUploaded);
    socket.on('attachment:deleted', handleAttachmentDeleted);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
      socket.off('attachment:uploaded', handleAttachmentUploaded);
      socket.off('attachment:deleted', handleAttachmentDeleted);
    };
  }, [socket, taskId]);

  const handleUpdate = async (fieldValues) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, fieldValues);
      if (res.task) {
        setTask(prev => ({ ...prev, ...res.task }));
        onTaskUpdated?.(res.task);
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    setIsEditingTitle(false);
    if (title !== task.title) {
      await handleUpdate({ title: title.trim() });
    }
  };

  const handleSaveDescription = async () => {
    setIsEditingDesc(false);
    if (description !== task.description) {
      await handleUpdate({ description: description.trim() });
    }
  };

  const handleAIEnhance = async () => {
    try {
      setIsEnhancing(true);
      const res = await api.post('/ai/enhance-task', {
        title: task.title,
        description: task.description || ''
      });

      if (res.enhancedDescription) {
        setDescription(res.enhancedDescription);
        await handleUpdate({
          description: res.enhancedDescription,
          priority: res.suggestedPriority || task.priority
        });
        showToast({ type: 'success', title: 'Task Enhanced', message: 'AI expanded description and subtasks.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Enhancement Failed', message: err.message });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete(`/tasks/${taskId}`);
      showToast({ type: 'success', title: 'Task Deleted', message: 'Task permanently removed.' });
      onTaskDeleted?.(taskId);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/tasks/${taskId}/comments`, {
        content: commentText.trim(),
        parent_id: replyingTo ? replyingTo.id : null
      });

      if (res.comment) {
        setTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), res.comment]
        }));
        setCommentText('');
        setReplyingTo(null);
        showToast({ type: 'success', title: 'Comment Posted', message: 'Your comment was added.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Comment Failed', message: 'Unable to post comment. Your text was preserved.' });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleSaveEditedComment = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await api.put(`/comments/${commentId}`, { content: editingCommentText.trim() });
      if (res.comment) {
        setTask(prev => ({
          ...prev,
          comments: prev.comments.map(c => (c.id === commentId ? { ...c, content: res.comment.content } : c))
        }));
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setTask(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
      showToast({ type: 'info', title: 'Comment Deleted', message: 'Comment removed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const res = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.attachment) {
        setTask(prev => ({
          ...prev,
          attachments: [res.attachment, ...(prev.attachments || [])]
        }));
        showToast({ type: 'success', title: 'File Uploaded', message: res.attachment.file_name });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Upload Failed', message: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachId) => {
    try {
      await api.delete(`/attachments/${attachId}`);
      setTask(prev => ({
        ...prev,
        attachments: prev.attachments.filter(a => a.id !== attachId)
      }));
      showToast({ type: 'info', title: 'Attachment Removed', message: 'File deleted.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Delete Failed', message: err.message });
    }
  };

  const handleToggleLabel = async (labelId) => {
    const currentLabelIds = task.labels?.map(l => l.id) || [];
    const newLabelIds = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter(id => id !== labelId)
      : [...currentLabelIds, labelId];

    await handleUpdate({ label_ids: newLabelIds });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
        <div className="w-full sm:w-[560px] md:w-[640px] h-full bg-white dark:bg-[#111418] border-l border-slate-200 dark:border-white/[0.08] shadow-drawer p-8 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">Loading task details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div 
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="w-full sm:w-[560px] md:w-[640px] h-full bg-white dark:bg-[#111418] border-l border-slate-200 dark:border-white/[0.08] shadow-drawer p-8 flex flex-col justify-center items-center text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Task Not Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'This task does not exist or was deleted.'}</p>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Nested comments mapping
  const rootComments = task.comments?.filter(c => !c.parent_id) || [];
  const getReplies = (parentId) => task.comments?.filter(c => c.parent_id === parentId) || [];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-2xs animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full sm:w-[560px] md:w-[640px] h-full bg-white dark:bg-[#111418] border-l border-slate-200/90 dark:border-white/[0.08] shadow-drawer dark:shadow-dark-elevated flex flex-col animate-in slide-in-from-right duration-250">
          
          {/* Top Header Bar */}
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50/60 dark:bg-[#171A1F]/50">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: task.project_color || '#4F46E5' }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{task.project_name}</span>
              <span className="text-slate-300 dark:text-white/[0.15]">•</span>
              <span className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">TASK-{task.id}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                title="Close drawer (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* Title Section (Click to Edit) */}
            <div className="space-y-1">
              {isEditingTitle ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    autoFocus
                    className="w-full text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-[#1F242C] px-3 py-2 rounded-xl border border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button size="xs" variant="primary" onClick={handleSaveTitle}>Save</Button>
                    <Button size="xs" variant="secondary" onClick={() => { setTitle(task.title); setIsEditingTitle(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.04] p-1.5 -ml-1.5 rounded-xl cursor-text transition-colors leading-snug"
                  title="Click to edit title"
                >
                  {task.title}
                </h2>
              )}
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-[#171A1F]/60 border border-slate-200/60 dark:border-white/[0.06] text-xs">
              
              {/* Status Selector */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdate({ status: e.target.value })}
                  className="w-full bg-white dark:bg-[#1F242C] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {COLUMNS.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handleUpdate({ priority: e.target.value })}
                  className="w-full bg-white dark:bg-[#1F242C] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Assignee Selector */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Assignee</span>
                <select
                  value={task.assigned_to || ''}
                  onChange={(e) => handleUpdate({ assigned_to: e.target.value ? Number(e.target.value) : null })}
                  className="w-full bg-white dark:bg-[#1F242C] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Due Date Picker */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 block mb-1">Due Date</span>
                <input
                  type="date"
                  value={task.due_date ? task.due_date.split('T')[0] : ''}
                  onChange={(e) => handleUpdate({ due_date: e.target.value || null })}
                  className="w-full bg-white dark:bg-[#1F242C] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] rounded-xl px-2.5 py-1.5 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Labels Section */}
            {projectLabels.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Labels</span>
                <div className="flex flex-wrap gap-1.5">
                  {projectLabels.map(lbl => {
                    const isSelected = task.labels?.some(l => l.id === lbl.id);
                    return (
                      <button
                        key={lbl.id}
                        onClick={() => handleToggleLabel(lbl.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-xs'
                            : 'bg-white dark:bg-[#171A1F] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300'
                        }`}
                        style={{
                          backgroundColor: isSelected ? lbl.color : undefined,
                          borderColor: isSelected ? lbl.color : undefined
                        }}
                      >
                        {lbl.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description Section with AI Enhancer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">Description</span>
                <button
                  onClick={handleAIEnhance}
                  disabled={isEnhancing}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{isEnhancing ? 'Enhancing...' : 'AI Enhance'}</span>
                </button>
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#1F242C] p-3 rounded-xl border border-indigo-500 focus:outline-none"
                    placeholder="Add task description or acceptance criteria..."
                  />
                  <div className="flex items-center gap-2">
                    <Button size="xs" variant="primary" onClick={handleSaveDescription}>Save</Button>
                    <Button size="xs" variant="secondary" onClick={() => { setDescription(task.description || ''); setIsEditingDesc(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#171A1F]/40 border border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-[#171A1F] cursor-text min-h-[90px] transition-colors"
                >
                  {task.description ? (
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {task.description}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Click to add a detailed description, user story, or checklist...
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Attachments ({task.attachments?.length || 0})
                </span>
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {isUploading && (
                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading file to secure storage...</span>
                </div>
              )}

              {task.attachments?.length > 0 ? (
                <div className="space-y-1.5">
                  {task.attachments.map(att => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#171A1F]/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{att.file_name}</span>
                        <span className="text-[10px] text-slate-400">({(att.file_size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={att.file_url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-md"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No files attached.</p>
              )}
            </div>

            {/* Tabs: Comments & Activity */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-2 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`pb-1 transition-colors cursor-pointer ${
                    activeTab === 'comments'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Comments ({task.comments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-1 transition-colors cursor-pointer ${
                    activeTab === 'activity'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  Activity ({task.activities?.length || 0})
                </button>
              </div>

              {/* Comments Tab Content */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* New Comment Input */}
                  <form onSubmit={handlePostComment} className="space-y-2">
                    {replyingTo && (
                      <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                        <span>Replying to <strong>{replyingTo.author_name}</strong></span>
                        <button onClick={() => setReplyingTo(null)} className="text-indigo-500 hover:text-indigo-700"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment or update..."
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1F242C] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        size="xs"
                        variant="primary"
                        isLoading={submittingComment}
                        disabled={!commentText.trim()}
                        icon={Send}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </form>

                  {/* Comments Thread List */}
                  <div className="space-y-3 pt-2">
                    {rootComments.map(comment => (
                      <div key={comment.id} className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#171A1F]/60 border border-slate-200/60 dark:border-white/[0.06] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={comment.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name || 'U')}`}
                                alt={comment.author_name}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                              />
                              <span className="font-bold text-slate-900 dark:text-white">{comment.author_name}</span>
                              <span className="text-[10px] text-slate-400">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              <button
                                onClick={() => setReplyingTo(comment)}
                                className="text-slate-400 hover:text-indigo-600 px-1"
                              >
                                Reply
                              </button>
                              {comment.user_id === user?.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-slate-400 hover:text-rose-600 px-1"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>

                        {/* Nested Replies */}
                        {getReplies(comment.id).map(reply => (
                          <div key={reply.id} className="ml-6 p-2.5 rounded-xl bg-slate-50/50 dark:bg-[#171A1F]/40 border border-slate-200/50 dark:border-white/[0.04] space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="w-3 h-3 text-slate-400" />
                                <span className="font-bold text-slate-900 dark:text-white">{reply.author_name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              {reply.user_id === user?.id && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-slate-400 hover:text-rose-600 text-[10px]"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap pl-5 leading-relaxed">
                              {reply.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Tab Content */}
              {activeTab === 'activity' && (
                <div className="space-y-2.5 text-xs">
                  {task.activities?.length > 0 ? (
                    task.activities.map(act => (
                      <div key={act.id} className="flex items-start gap-2.5 py-1">
                        <img
                          src={act.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user_name || 'U')}`}
                          alt={act.user_name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 dark:text-slate-300">
                            <strong className="font-semibold text-slate-900 dark:text-white">{act.user_name}</strong>{' '}
                            {act.action}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 dark:text-slate-500 italic py-4 text-center">No activity history yet.</p>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        title="Delete this task?"
        description="This will permanently delete the task, attachments, and threaded comments. This action cannot be undone."
        confirmText="Delete Task"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmDeleteOpen(false)}
      />
    </>
  );
};

export default TaskModal;

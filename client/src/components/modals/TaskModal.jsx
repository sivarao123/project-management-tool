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
  Loader2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';

const PRIORITY_CONFIG = {
  Low: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  High: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Urgent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const COLUMNS = ['BACKLOG', 'TODO', 'IN PROGRESS', 'IN REVIEW', 'DONE'];

const TaskModal = ({ taskId, onClose, onTaskUpdated, onTaskDeleted, projectMembers = [], projectLabels = [] }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'

  // Editable fields state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // comment object or null
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // File upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  // Real-time socket events for this task
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
      alert('Failed to update task: ' + err.message);
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

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      onTaskDeleted?.(taskId);
      onClose();
    } catch (err) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/tasks/${taskId}/comments`, {
        content: commentText.trim(),
        parent_id: replyingTo?.id || null
      });

      if (res.comment) {
        setTask(prev => ({
          ...prev,
          comments: [...(prev.comments || []), res.comment]
        }));
        setCommentText('');
        setReplyingTo(null);
      }
    } catch (err) {
      alert('Failed to post comment: ' + err.message);
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
      }
    } catch (err) {
      alert('Failed to edit comment: ' + err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setTask(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c.id !== commentId)
      }));
    } catch (err) {
      alert('Failed to delete comment: ' + err.message);
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
      }
    } catch (err) {
      alert('Failed to upload file: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachId) => {
    if (!window.confirm('Remove this attachment?')) return;
    try {
      await api.delete(`/attachments/${attachId}`);
      setTask(prev => ({
        ...prev,
        attachments: prev.attachments.filter(a => a.id !== attachId)
      }));
    } catch (err) {
      alert('Failed to delete attachment: ' + err.message);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
        <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-700">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">Task Not Found</p>
          <p className="text-xs text-slate-500 mt-1">{error || 'This task does not exist or was deleted.'}</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Nested comments mapping
  const rootComments = task.comments?.filter(c => !c.parent_id) || [];
  const getReplies = (parentId) => task.comments?.filter(c => c.parent_id === parentId) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.project_color || '#4F46E5' }} />
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{task.project_name}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-400">TASK-{task.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (2 Columns on Desktop) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          {/* Left / Center: Details, Description, Attachments, Comments */}
          <div className="lg:col-span-2 p-6 space-y-6">
            
            {/* Task Title */}
            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="w-full text-lg sm:text-xl font-bold text-slate-900 border border-indigo-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setTitle(task.title);
                      setIsEditingTitle(false);
                    }}
                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg sm:text-xl font-bold text-slate-900 hover:text-indigo-600 cursor-pointer flex items-center justify-between group transition-colors"
                  title="Click to edit title"
                >
                  <span>{task.title}</span>
                  <Edit3 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Description</span>
                {!isEditingDesc && (
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium normal-case flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add detailed task notes, acceptance criteria, or links..."
                    className="w-full text-sm text-slate-800 border border-indigo-300 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setDescription(task.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className={`p-3 rounded-xl border border-slate-100 text-sm leading-relaxed cursor-pointer hover:border-slate-200 transition-colors ${
                    task.description ? 'text-slate-700 bg-slate-50/50' : 'text-slate-400 italic bg-slate-50/30'
                  }`}
                >
                  {task.description || 'No description provided. Click to add detailed context...'}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                  Attachments ({task.attachments?.length || 0})
                </span>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-indigo-600 hover:text-indigo-800 font-medium normal-case flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Upload file
                      </>
                    )}
                  </button>
                </div>
              </div>

              {task.attachments?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between group hover:border-indigo-200 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{file.file_name}</p>
                          <p className="text-[10px] text-slate-400">
                            {(file.file_size / 1024).toFixed(1)} KB • {file.uploader_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          download={file.file_name}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteAttachment(file.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors"
                >
                  <p className="text-xs text-slate-500 font-medium">Click to upload documents, designs, or specs</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG, ZIP (max 10MB)</p>
                </div>
              )}
            </div>

            {/* Tabs: Comments & Task Activity */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-2">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors pb-1 border-b-2 -mb-2.5 ${
                    activeTab === 'comments'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion ({task.comments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 text-xs font-semibold transition-colors pb-1 border-b-2 -mb-2.5 ${
                    activeTab === 'activity'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Activity History</span>
                </button>
              </div>

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Post Comment Input */}
                  <form onSubmit={handlePostComment} className="space-y-2">
                    {replyingTo && (
                      <div className="flex items-center justify-between text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
                        <span>Replying to <strong>{replyingTo.author_name}</strong></span>
                        <button onClick={() => setReplyingTo(null)} className="hover:text-indigo-900">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <img
                        src={user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 mt-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <textarea
                          rows={2}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment or reply... (Enter to post)"
                          className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end mt-1.5">
                          <button
                            type="submit"
                            disabled={submittingComment || !commentText.trim()}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Comment</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Comment Thread List */}
                  <div className="space-y-3 pt-2">
                    {rootComments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No comments yet. Start the conversation!
                      </p>
                    ) : (
                      rootComments.map((comm) => {
                        const replies = getReplies(comm.id);
                        return (
                          <div key={comm.id} className="space-y-2">
                            {/* Root Comment Box */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100/80 space-y-1.5 group">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img
                                    src={comm.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comm.author_name)}`}
                                    alt=""
                                    className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                                  />
                                  <span className="text-xs font-semibold text-slate-800">{comm.author_name}</span>
                                  <span className="text-[10px] text-slate-400">
                                    {comm.created_at ? formatDistanceToNow(new Date(comm.created_at), { addSuffix: true }) : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setReplyingTo(comm)}
                                    className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/50"
                                  >
                                    Reply
                                  </button>
                                  {comm.user_id === user?.id && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(comm.id);
                                          setEditingCommentText(comm.content);
                                        }}
                                        className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/50"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(comm.id)}
                                        className="text-[11px] text-slate-500 hover:text-rose-600 font-medium px-1.5 py-0.5 rounded hover:bg-slate-200/50"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {editingCommentId === comm.id ? (
                                <div className="space-y-1.5 pt-1">
                                  <input
                                    type="text"
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    className="w-full text-xs border border-indigo-300 rounded-lg p-1.5"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveEditedComment(comm.id)}
                                      className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px]"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingCommentId(null)}
                                      className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 leading-relaxed pl-8">{comm.content}</p>
                              )}
                            </div>

                            {/* Nested Replies */}
                            {replies.length > 0 && (
                              <div className="pl-6 space-y-2">
                                {replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="p-2.5 rounded-xl bg-white border border-slate-200/70 space-y-1 group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <CornerDownRight className="w-3 h-3 text-slate-400" />
                                        <img
                                          src={reply.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.author_name)}`}
                                          alt=""
                                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                                        />
                                        <span className="text-xs font-semibold text-slate-800">{reply.author_name}</span>
                                        <span className="text-[10px] text-slate-400">
                                          {reply.created_at ? formatDistanceToNow(new Date(reply.created_at), { addSuffix: true }) : ''}
                                        </span>
                                      </div>
                                      {reply.user_id === user?.id && (
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-rose-600"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed pl-7">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Activity History Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-3 py-2">
                  {task.activities?.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No logged history yet.</p>
                  ) : (
                    task.activities?.map((act) => (
                      <div key={act.id} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <img
                          src={act.user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(act.user_name || 'U')}`}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 mt-0.5"
                        />
                        <div className="flex-1">
                          <p>
                            <strong className="text-slate-800">{act.user_name}</strong>{' '}
                            <span className="text-slate-500">
                              {act.action === 'created_task' && 'created this task'}
                              {act.action === 'moved_task' && 'updated status'}
                              {act.action === 'assigned_task' && 'updated assignee'}
                              {act.action === 'added_comment' && 'commented'}
                              {act.action === 'uploaded_attachment' && 'uploaded an attachment'}
                            </span>
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {act.created_at ? formatDistanceToNow(new Date(act.created_at), { addSuffix: true }) : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Metadata Properties Controls */}
          <div className="p-6 bg-slate-50/50 space-y-5">
            
            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Status</label>
              <select
                value={task.status}
                onChange={(e) => handleUpdate({ status: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                {COLUMNS.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdate({ priority: e.target.value })}
                className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🔵 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>

            {/* Assignee Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assignee</label>
              <select
                value={task.assignee_id || ''}
                onChange={(e) => handleUpdate({ assignee_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="">Unassigned</option>
                {projectMembers.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Due Date</label>
              <input
                type="date"
                value={task.due_date ? task.due_date.split('T')[0] : ''}
                onChange={(e) => handleUpdate({ due_date: e.target.value || null })}
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              />
            </div>

            {/* Labels Tag Manager */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Labels ({task.labels?.length || 0})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {projectLabels.map((lbl) => {
                  const isSelected = task.labels?.some(l => l.id === lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      onClick={() => handleToggleLabel(lbl.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-transparent text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                      style={{
                        backgroundColor: isSelected ? lbl.color : undefined
                      }}
                    >
                      {lbl.name}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Task Info Summary */}
            <div className="border-t border-slate-200/80 pt-4 space-y-1.5 text-[11px] text-slate-400">
              <p>Created: {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : 'Recently'}</p>
              <p>Created by: {task.creator_name || 'System'}</p>
              <p>Last updated: {task.updated_at ? formatDistanceToNow(new Date(task.updated_at), { addSuffix: true }) : 'Recently'}</p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default TaskModal;

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
  Filter,
  Check,
  Shield,
  Clock,
  User,
  ExternalLink,
  Power,
  RotateCcw,
} from 'lucide-react';
import { CommentItem, CommentsSettings, PromptPost } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

interface CommentsModerationSectionProps {
  onOpenPreviewModal?: (post: PromptPost) => void;
}

export const CommentsModerationSection: React.FC<CommentsModerationSectionProps> = ({ onOpenPreviewModal }) => {
  const [comments, setComments] = useState<CommentItem[]>(() => promptStore.getComments());
  const [settings, setSettings] = useState<CommentsSettings>(() => promptStore.getCommentsSettings());
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'spam'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setComments(promptStore.getComments());
      setSettings(promptStore.getCommentsSettings());
    });
    return unsub;
  }, []);

  const filteredComments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return comments.filter((c) => {
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchQuery =
        !query ||
        c.authorName?.toLowerCase().includes(query) ||
        c.authorEmail?.toLowerCase().includes(query) ||
        c.content?.toLowerCase().includes(query) ||
        c.postTitle?.toLowerCase().includes(query);
      return matchStatus && matchQuery;
    });
  }, [comments, statusFilter, searchQuery]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'pending' | 'spam') => {
    try {
      await promptStore.updateCommentStatus(id, status);
      showToast('Comment Updated', `Comment marked as ${status}.`, 'success');
    } catch (e) {
      showToast('Error', 'Failed to update comment status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await promptStore.deleteComment(id);
      setDeleteTargetId(null);
      showToast('Comment Deleted', 'Comment removed permanently.', 'info');
    } catch (e) {
      showToast('Error', 'Failed to delete comment.', 'error');
    }
  };

  const handleToggleAutoApprove = async () => {
    const updated = { ...settings, autoApprove: !settings.autoApprove };
    setSettings(updated);
    await promptStore.updateCommentsSettings(updated);
    showToast('Auto-Approve Updated', `Auto-approve comments is now ${updated.autoApprove ? 'ON' : 'OFF'}.`);
  };

  const handleToggleCommentsSystem = async () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    await promptStore.updateCommentsSettings(updated);
    showToast('Comments System', `User commenting is now ${updated.enabled ? 'Enabled' : 'Disabled'}.`);
  };

  const stats = useMemo(() => {
    return {
      total: comments.length,
      pending: comments.filter((c) => c.status === 'pending').length,
      approved: comments.filter((c) => c.status === 'approved').length,
      spam: comments.filter((c) => c.status === 'spam').length,
    };
  }, [comments]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <span>Comments Moderation & Approvals</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review user feedback, approve pending comments, and protect against spam submissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleCommentsSystem}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              settings.enabled !== false
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{settings.enabled !== false ? 'Comments System ON' : 'Comments System OFF'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-3xl bg-zinc-900 border transition-all cursor-pointer ${
            statusFilter === 'all' ? 'border-blue-500/50 bg-blue-500/5' : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Comments</div>
          <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
        </div>

        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-3xl bg-zinc-900 border transition-all cursor-pointer ${
            statusFilter === 'pending' ? 'border-amber-500/50 bg-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.pending}</div>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-3xl bg-zinc-900 border transition-all cursor-pointer ${
            statusFilter === 'approved' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.approved}</div>
        </div>

        <div
          onClick={() => setStatusFilter('spam')}
          className={`p-4 rounded-3xl bg-zinc-900 border transition-all cursor-pointer ${
            statusFilter === 'spam' ? 'border-rose-500/50 bg-rose-500/5' : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hidden / Spam</span>
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">{stats.spam}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search author, post, or text..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
            <input
              type="checkbox"
              checked={settings.autoApprove}
              onChange={handleToggleAutoApprove}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-Approve New Comments</span>
          </label>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden">
        {filteredComments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Comments Found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchQuery
                ? 'No comments matched your search query. Try clearing the search filter.'
                : `There are currently no ${statusFilter !== 'all' ? statusFilter : ''} comments.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredComments.map((comment) => {
              const isPending = comment.status === 'pending';
              const isApproved = comment.status === 'approved';
              const isSpam = comment.status === 'spam';

              return (
                <div key={comment.id} className="p-5 sm:p-6 hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {comment.authorName ? comment.authorName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs">{comment.authorName || 'Anonymous'}</span>
                        {comment.authorEmail && (
                          <span className="text-[11px] text-zinc-500 ml-2">({comment.authorEmail})</span>
                        )}
                      </div>
                      <span className="text-zinc-600 text-xs">·</span>
                      <span className="text-[11px] text-zinc-500">
                        {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ml-auto sm:ml-0 ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isPending
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-200 leading-relaxed font-normal bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      "{comment.content}"
                    </p>

                    {comment.postTitle && (
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                        <span className="text-zinc-500">On Prompt:</span>
                        <span className="font-semibold text-zinc-300 truncate max-w-md">{comment.postTitle}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(comment.id, 'approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Approve Comment"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {!isSpam && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(comment.id, 'spam')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Mark as Spam / Hide"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(comment.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Comment Permanently?</h3>
              <p className="text-xs text-zinc-400 mt-1">This comment will be permanently erased from your database.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTargetId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Delete Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

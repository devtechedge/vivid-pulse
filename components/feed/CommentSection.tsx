'use client';

import * as React from 'react';
import { CornerDownRight, MessageSquare, Send, Reply, X, Loader2 } from 'lucide-react';
import { addComment, getComments, ThreadedComment } from '@/lib/actions';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface CommentSectionProps {
  postId: string;
  onCommentCountChanged?: (count: number) => void;
}

export default function CommentSection({ postId, onCommentCountChanged }: CommentSectionProps) {
  const [comments, setComments] = React.useState<ThreadedComment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [content, setContent] = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState<ThreadedComment | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    Promise.resolve().then(() => {
      fetchComments();
    });
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    const parentId = replyingTo ? replyingTo.id : undefined;

    try {
      const res = await addComment(postId, content, parentId);
      if (res.success && res.comment) {
        setContent('');
        setReplyingTo(null);
        await fetchComments(); // Reload to get fully formatted nested thread

        // Compute total comment count
        const allComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0) + 1;
        if (onCommentCountChanged) {
          onCommentCountChanged(allComments);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[d.getMonth()]} ${d.getDate()}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col gap-4 max-h-[450px] min-h-[150px]">
      {/* Title Header */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-slate-900/60">
        <MessageSquare className="w-4 h-4 text-violet-400" />
        <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
          Engagement Thread
        </span>
      </div>

      {/* Comment List Scroller */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <span className="text-xs font-mono">Syncing thread...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600 text-center">
            <span className="text-xs font-mono uppercase tracking-widest mb-1 text-slate-500">Silent Canvas</span>
            <span className="text-[10px] text-slate-600">Be the first to inject a comment on this pulse.</span>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex flex-col gap-2.5">
              {/* Parent Comment */}
              <div className="flex gap-3">
                <img
                  src={comment.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                  alt={comment.username}
                  className="w-7 h-7 rounded object-cover border border-slate-800"
                />
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {comment.username}
                    </span>
                    <span className="text-[9px] font-mono text-slate-600">
                      {getRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {comment.content}
                  </p>
                  
                  {/* Action items (Reply) */}
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => setReplyingTo(comment)}
                      className="flex items-center gap-1.5 text-[9px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      <Reply className="w-2.5 h-2.5" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 flex flex-col gap-3">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-2.5">
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-700 mt-1 flex-shrink-0" />
                      <img
                        src={reply.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                        alt={reply.username}
                        className="w-5.5 h-5.5 rounded object-cover border border-slate-800"
                      />
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[11px] font-bold text-slate-300">
                            {reply.username}
                          </span>
                          <span className="text-[8px] font-mono text-slate-600">
                            {getRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment Input Footer */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t border-slate-900 bg-slate-950">
        {replyingTo && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-violet-950/20 border border-violet-900/30 rounded text-[10px] font-bold text-violet-300 uppercase tracking-wider">
            <span className="truncate">Replying to @{replyingTo.username}</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="relative flex items-center">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            placeholder={replyingTo ? "Compose encrypted reply..." : "Inject thoughts on this pulse..."}
            className="w-full bg-slate-900 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-xs text-slate-200 placeholder:text-slate-600 pl-4 pr-12 py-3 rounded outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="absolute right-3.5 text-violet-500 hover:text-violet-300 transition-colors cursor-pointer disabled:text-slate-700 disabled:pointer-events-none"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

'use client';

import * as React from 'react';
import { Send, MessageSquare, Plus, Loader2, Sparkles, ShieldCheck, CornerDownRight, CheckCheck, RefreshCw } from 'lucide-react';
import { getConversations, getDirectMessages, sendMessage, getCurrentUser, Conversation } from '@/lib/actions';
import { getDB, User, DirectMessage } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [activeConv, setActiveConv] = React.useState<Conversation | null>(null);
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  // Suggested users list to start new chats
  const [suggestedUsers, setSuggestedUsers] = React.useState<User[]>([]);
  const [showSuggested, setShowSuggested] = React.useState(false);

  const fetchConversationsList = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);

      const convs = await getConversations();
      setConversations(convs);

      // If active conversation is selected, sync its latest status
      if (activeConv) {
        const currentActive = convs.find(c => c.otherUser.id === activeConv.otherUser.id);
        if (currentActive) {
          setActiveConv(currentActive);
        }
      }

      // Fetch suggestion list (users who are not current user and not in active chats)
      const db = await getDB();
      const chatUserIds = convs.map(c => c.otherUser.id);
      const suggestions = db.users.filter(
        u => u.id !== user?.id && !chatUserIds.includes(u.id)
      );
      setSuggestedUsers(suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchActiveThread = async (otherUserId: string, silent = false) => {
    try {
      const msgs = await getDirectMessages(otherUserId);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Initial Load
  React.useEffect(() => {
    Promise.resolve().then(() => {
      fetchConversationsList();
    });
  }, []);

  // 2. Active thread load on selection
  React.useEffect(() => {
    if (activeConv) {
      Promise.resolve().then(() => {
        fetchActiveThread(activeConv.otherUser.id);
      });
    } else {
      Promise.resolve().then(() => {
        setMessages([]);
      });
    }
  }, [activeConv]);

  // 3. SECURE FALLBACK SHORT-POLLING POOL (Interval 3000ms)
  // Ensures serverless continuous synchronization of conversations and messages!
  React.useEffect(() => {
    const pollInterval = setInterval(() => {
      // Refresh conversation list silently in background
      fetchConversationsList(true);
      
      // Refresh current active chat thread silently in background
      if (activeConv) {
        fetchActiveThread(activeConv.otherUser.id, true);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeConv || sending) return;

    setSending(true);
    const targetUserId = activeConv.otherUser.id;
    const msgText = content;
    setContent('');

    try {
      const res = await sendMessage(targetUserId, msgText);
      if (res.success) {
        // Instant client sync after send
        await fetchActiveThread(targetUserId, true);
        await fetchConversationsList(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = (user: User) => {
    const dummyConversation: Conversation = {
      otherUser: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      latestMessage: {
        id: 'temp',
        senderId: user.id,
        receiverId: currentUser?.id || '',
        content: 'Conversation initialized.',
        mediaUrl: null,
        isRead: true,
        createdAt: new Date().toISOString()
      },
      unreadCount: 0,
    };

    setActiveConv(dummyConversation);
    setShowSuggested(false);
    
    // Add to conversations list immediately
    setConversations(prev => [dummyConversation, ...prev]);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-8 h-[calc(100vh-2rem)] md:h-screen flex flex-col">
      
      <div className="flex-grow bg-slate-950 border border-slate-900 rounded overflow-hidden flex shadow-[0_0_50px_rgba(0,0,0,0.6)] h-full">
        
        {/* LEFT PANEL: CONVERSATIONS SIDEBAR */}
        <div className="w-full md:w-80 border-r border-slate-900 flex flex-col bg-slate-950 h-full flex-shrink-0">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Direct Channels
              </span>
            </div>
            
            {/* Initialize New Chat Trigger */}
            <button
              onClick={() => setShowSuggested(!showSuggested)}
              className="p-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/20 rounded cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Conversations Scroll Box */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
            {showSuggested && (
              <div className="mb-3 p-3 bg-slate-900/40 border border-slate-800 rounded flex flex-col gap-2">
                <span className="text-[9px] font-bold tracking-widest text-teal-400 uppercase">Start New Channel</span>
                {suggestedUsers.length === 0 ? (
                  <span className="text-[10px] text-slate-600 font-mono">No other profiles found.</span>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {suggestedUsers.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleStartChat(user)}
                        className="flex items-center gap-2 p-1.5 hover:bg-slate-800 rounded text-left w-full cursor-pointer transition-all group"
                      >
                        <img src={user.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'} alt={user.displayName || user.username} className="w-6 h-6 rounded object-cover" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-300 group-hover:text-white truncate">@{user.username}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-600 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span className="text-[10px]">Syncing links...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Grid Silent</span>
                <span className="text-[10px] text-slate-600 leading-relaxed">
                  No messaging threads exist yet. Initialize a new secure channel using the &quot;+&quot; trigger above.
                </span>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = activeConv?.otherUser.id === conv.otherUser.id;
                return (
                  <button
                    key={conv.otherUser.id}
                    onClick={() => {
                      setActiveConv(conv);
                      setShowSuggested(false);
                    }}
                    className={cn(
                      'flex items-center justify-between p-3 rounded text-left transition-all group cursor-pointer border',
                      isActive
                        ? 'bg-slate-900/60 border-violet-500/30'
                        : 'bg-transparent border-transparent hover:bg-slate-900/20 hover:border-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={conv.otherUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                          alt={conv.otherUser.username}
                          className="w-9 h-9 rounded object-cover border border-slate-800"
                        />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-[0_0_8px_rgba(124,58,237,0.6)]">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn('text-xs font-bold leading-none mb-1 group-hover:text-white', isActive ? 'text-violet-400' : 'text-slate-200')}>
                          {conv.otherUser.displayName}
                        </span>
                        <p className="text-[10px] text-slate-500 truncate leading-none">
                          {conv.latestMessage.content}
                        </p>
                      </div>
                    </div>
                    
                    <span className="text-[9px] font-mono text-slate-600 flex-shrink-0">
                      {formatTime(conv.latestMessage.createdAt)}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Secure signal footer bar */}
          <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center gap-2 text-[9px] font-mono text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>ENCRYPTED PROTOCOL PORT ACTIVE</span>
          </div>

        </div>

        {/* RIGHT PANEL: CHAT HISTORIES PANEL */}
        <div className="flex-1 flex flex-col bg-slate-950 h-full">
          {activeConv ? (
            <>
              {/* Active Conversation User Header */}
              <div className="px-5 py-4 border-b border-slate-900 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={activeConv.otherUser.avatarUrl || 'https://picsum.photos/seed/placeholder/100/100'}
                    alt={activeConv.otherUser.username}
                    className="w-9 h-9 rounded object-cover border border-slate-800"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200 leading-none mb-1">
                      {activeConv.otherUser.displayName}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      @{activeConv.otherUser.username}
                    </span>
                  </div>
                </div>

                {/* Polling/Live indicator */}
                <div className="flex items-center gap-2 px-2 py-1 bg-teal-950/20 border border-teal-900/30 text-[9px] font-mono text-teal-400 rounded">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping" />
                  <span>SHORT-POLL ACTIVE</span>
                </div>
              </div>

              {/* Message Scroller stage */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-950">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    <span className="text-xs font-mono">Establish secure feed packets...</span>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.senderId === currentUser?.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex flex-col max-w-[70%] gap-1',
                          isMe ? 'self-end items-end' : 'self-start items-start'
                        )}
                      >
                        {/* Chat bubble body */}
                        <div
                          className={cn(
                            'px-4 py-2.5 text-xs font-light leading-relaxed rounded shadow-md',
                            isMe
                              ? 'bg-violet-600 text-white rounded-br-none shadow-[0_4px_12px_rgba(124,58,237,0.15)]'
                              : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                          )}
                        >
                          {msg.content}
                        </div>
                        {/* Metadata line */}
                        <div className="flex items-center gap-1 text-[8px] font-mono text-slate-600">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && <CheckCheck className="w-2.5 h-2.5 text-violet-400" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input form footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={sending}
                    placeholder={`Compose secure packet to @${activeConv.otherUser.username}...`}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 px-4 py-3.5 pr-12 rounded outline-none focus:border-violet-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                  />
                  <button
                    type="submit"
                    disabled={!content.trim() || sending}
                    className="absolute right-4 text-violet-500 hover:text-violet-400 transition-colors disabled:text-slate-700 disabled:pointer-events-none cursor-pointer"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            // No selected chat empty placeholder
            <div className="flex-grow flex flex-col items-center justify-center text-slate-600 gap-3 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-slate-800" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Terminal Static</h3>
              <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                Select an active communications thread from the left rail or initiate a new connection using the &quot;+&quot; menu button.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

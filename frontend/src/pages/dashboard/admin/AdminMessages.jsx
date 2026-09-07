/**
 * Admin Contact Messages — view and manage contact form submissions.
 */
import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Check, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../../api/endpoints';
import EmptyState from '../../../components/EmptyState';
import AnimatedPage from '../../../components/AnimatedPage';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    adminAPI.getContactMessages()
      .then(({ data }) => setMessages(data.messages || data || []))
      .catch(() => toast.error('Failed to load messages.'))
      .finally(() => setLoading(false));
  };

  const markAsRead = async (id) => {
    try {
      await adminAPI.markMessageRead(id);
      setMessages((prev) =>
        prev.map((m) => ((m.id || m._id) === id ? { ...m, is_read: true } : m))
      );
      toast.success('Marked as read.');
    } catch {
      toast.error('Failed to update.');
    }
  };

  return (
    <AnimatedPage>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Messages</h1>
        <span className="badge-info">
          {messages.filter((m) => !m.is_read).length} unread
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages" description="No contact form submissions yet." />
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const mid = msg.id || msg._id;
            const isExpanded = expandedId === mid;
            return (
              <div key={mid} className={`card overflow-hidden ${!msg.is_read ? 'border-l-4 border-l-primary-500' : ''}`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : mid)}
                  className="w-full p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        msg.is_read
                          ? 'bg-slate-100 dark:bg-slate-800'
                          : 'bg-primary-50 dark:bg-primary-900/20'
                      }`}>
                        <Mail className={`w-5 h-5 ${msg.is_read ? 'text-slate-400' : 'text-primary-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {msg.name}
                          </h3>
                          {!msg.is_read && (
                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{msg.email}</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                          {msg.subject}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-800/20">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>
                    {!msg.is_read && (
                      <button
                        onClick={() => markAsRead(mid)}
                        className="mt-4 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Mark as Read
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AnimatedPage>
  );
}

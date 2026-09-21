import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  User,
  Shield,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Building2,
} from 'lucide-react';

export interface ProjectMessage {
  id: string;
  ventureId: string;
  sender: 'customer' | 'admin';
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface ProjectMessengerModalProps {
  ventureId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMessengerModal: React.FC<ProjectMessengerModalProps> = ({
  ventureId = 'ven_docuflow_02',
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [senderName, setSenderName] = useState<string>('Founder');
  const [senderEmail, setSenderEmail] = useState<string>('founder@venture.com');
  const [statusNotice, setStatusNotice] = useState<string>('');

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/${ventureId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.warn('Failed to load project messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, ventureId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      text: inputText.trim(),
      sender: isAdminMode ? 'admin' : 'customer',
      senderName: isAdminMode ? 'Jason Moyer (Moyer Ventures LLC)' : (senderName || 'Founder'),
      senderEmail: isAdminMode ? 'jason@moyervllc.com' : (senderEmail || 'founder@venture.com'),
    };

    try {
      const res = await fetch(`/api/messages/${ventureId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setMessages((prev) => [...prev, result.data]);
        setInputText('');
        setStatusNotice(
          isAdminMode
            ? 'Reply sent to customer!'
            : 'Message sent! Jason Moyer notified via Google Chat (jason@moyervllc.com).'
        );
        setTimeout(() => setStatusNotice(''), 4000);
      }
    } catch (err: any) {
      console.warn('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col h-[620px] max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-glow-indigo">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-white">Project Messaging & Collaboration</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-full">
                  {ventureId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Direct channel between Founder & Moyer Ventures LLC
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Admin Switcher Toggle */}
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors border ${
                isAdminMode
                  ? 'bg-amber-950/70 border-amber-600/60 text-amber-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Toggle to view or reply as Jason Moyer (Admin)"
            >
              {isAdminMode ? '👑 Admin Mode (Jason)' : 'Switch to Admin'}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-800/60 px-4 py-2 text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/50">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-400 space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading project conversation...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No messages yet for this venture.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Ask a question about your stage-gate verification, Stripe setup, or deployment customization.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.sender === 'admin';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-400">
                    {isAdmin ? (
                      <Shield className="w-3 h-3 text-amber-400" />
                    ) : (
                      <User className="w-3 h-3 text-indigo-400" />
                    )}
                    <span className="font-medium text-slate-300">{m.senderName}</span>
                    <span>•</span>
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm ${
                      isAdmin
                        ? 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-tl-sm'
                        : 'bg-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isAdminMode
                  ? 'Reply to customer as Jason Moyer (Moyer Ventures LLC)...'
                  : 'Message Jason Moyer about your venture...'
              }
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-medium hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-indigo"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              <span>Send</span>
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>
                {isAdminMode
                  ? 'Sending as: jason@moyervllc.com'
                  : 'Replies notified directly to jason@moyervllc.com (Google Chat)'}
              </span>
            </span>
            <span className="font-mono">Stage Gate Comm v1.0</span>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import AppLayout from '../components/layout/AppLayout';
import { MessageSquareText, Send, Bot, User, Lightbulb, AlertTriangle, CheckCircle, Info, Activity } from 'lucide-react';
import { assistantService, projectService } from '../services/api';

const SUGGESTIONS = [
  'Why is this project high risk?',
  'What are the main risk factors?',
  'What caused the risk score to increase?',
  'What is the predicted cost overrun risk?',
  'What milestones are delayed?',
  'What should the project team review?',
  'Compare the current progress with planned progress.',
  'Summarize the project\'s current status.',
  'Which factors are contributing most to risk?',
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: 'Hello! I\'m the InfraWatch AI Assistant. Please select a project and I can help you understand its risks, alerts, cost overruns, and recommend actions.',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    projectService.getAll()
      .then(r => {
        const prjs = r.data?.content || r.data || [];
        setProjects(prjs);
        if (prjs.length > 0) setSelectedProjectId(prjs[0].id);
      })
      .catch(console.error);
  }, []);

  const send = async (question) => {
    const q = question || input.trim();
    if (!q || !selectedProjectId) return;
    setInput('');

    const userMsg = { role: 'user', content: q, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await assistantService.chat({ message: q, projectId: selectedProjectId });
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: res.data.reply, 
        sources: res.data.sources,
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: error.response?.data?.error || "Sorry, I couldn't process that request.", 
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <MessageSquareText className="w-6 h-6 text-violet-400" />
          AI Assistant
        </h1>
        <p className="text-slate-400 text-sm mt-1">Ask questions about project risks, alerts, and monitoring data</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Project</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Suggested Questions
            </h2>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="w-full text-left text-xs text-slate-400 hover:text-slate-200 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl px-4 py-3 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
        </div>

        {/* Chat */}
        <div className="xl:col-span-3 flex flex-col bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden" style={{ height: '65vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-slide-in`}>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'bot' ? 'bg-violet-500/20 text-violet-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                  {m.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'bot'
                      ? 'bg-slate-800 text-slate-200 rounded-tl-none whitespace-pre-wrap'
                      : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100 rounded-tr-none'
                  }`}>
                    {m.content}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                        {m.sources.map((s, idx) => {
                          const isFact = s === 'FACT';
                          const isPred = s === 'PREDICTION';
                          const isRec = s === 'RECOMMENDATION';
                          return (
                            <span key={idx} className={`text-[10px] px-2 py-1 rounded-md flex items-center gap-1 ${
                              isFact ? 'bg-blue-500/20 text-blue-400' :
                              isPred ? 'bg-purple-500/20 text-purple-400' :
                              'bg-amber-500/20 text-amber-400'
                            }`}>
                              {isFact && <Info className="w-3 h-3" />}
                              {isPred && <Activity className="w-3 h-3" />}
                              {isRec && <CheckCircle className="w-3 h-3" />}
                              {s}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-600">{m.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                id="ai-chat-input"
                placeholder="Ask about project risks, alerts, recommendations..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                id="ai-send-btn"
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white rounded-xl transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

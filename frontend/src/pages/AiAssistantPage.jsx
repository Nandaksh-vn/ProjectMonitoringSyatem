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
      content: 'Hello! I\'m the AI Assistant for the InfraWatch portal. Please select a project and I can help you understand its risks, alerts, cost overruns, and recommend actions.',
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
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 tracking-wide uppercase">AI Features / Assistant</div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <MessageSquareText className="w-6 h-6 text-brand-600" />
            AI Query Assistant
          </h1>
          <p className="text-slate-600 text-sm mt-1">Interrogate project data and ML predictions using natural language</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="gov-card p-5 bg-slate-50">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Select Target Project</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:border-brand-500 shadow-sm"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} - {p.projectName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Suggested Queries
            </h2>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="w-full text-left text-sm font-medium text-slate-700 hover:text-brand-700 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded p-3 transition-colors shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
        </div>

        {/* Chat */}
        <div className="xl:col-span-3 flex flex-col gov-card overflow-hidden" style={{ height: '70vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${m.role === 'bot' ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-slate-200 text-slate-700 border border-slate-300'}`}>
                  {m.role === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  <div className={`px-5 py-4 rounded-xl text-sm font-medium leading-relaxed shadow-sm ${
                    m.role === 'bot'
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                      : 'bg-brand-600 text-white rounded-tr-none'
                  }`}>
                    {m.content}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1 mt-1 shrink-0">Sources:</span>
                        {m.sources.map((s, idx) => {
                          const isFact = s === 'FACT';
                          const isPred = s === 'PREDICTION';
                          const isRec = s === 'RECOMMENDATION';
                          return (
                            <span key={idx} className={`text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1 ${
                              isFact ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              isPred ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
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
                  <span className="text-[10px] font-bold text-slate-400 mx-1">{m.time}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-brand-100 text-brand-700 border border-brand-200 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5 text-brand-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-xl rounded-tl-none px-5 py-4 flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2.5 h-2.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                id="ai-chat-input"
                placeholder="Ask about project risks, alerts, recommendations..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                className="flex-1 bg-white border border-slate-300 rounded px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                id="ai-send-btn"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded font-bold transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

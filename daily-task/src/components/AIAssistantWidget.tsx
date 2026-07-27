import React, { useState, useRef, useEffect } from 'react';
import { UserRole, Task, Assignment, Subject } from '../types';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  MessageSquare, 
  Lightbulb, 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  Minimize2, 
  RotateCcw,
  GraduationCap
} from 'lucide-react';

interface AIAssistantWidgetProps {
  role: UserRole;
  tasks: Task[];
  assignments: Assignment[];
  subjects: Subject[];
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  role,
  tasks,
  assignments,
  subjects,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: role === 'teacher'
        ? "Hello Professor! I'm your AI Academic Assistant. I can help you draft assignment criteria, create quiz questions, or analyze student performance."
        : "Hi! I'm your AI Study Assistant powered by Gemini. Ask me any homework questions, study tips, task planning, or topic explanations!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend || inputValue).trim();
    if (!promptText || isLoading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          role,
          context: {
            tasksCount: tasks.length,
            pendingTasks: tasks.filter(t => t.status !== 'completed').map(t => ({ title: t.title, dueDate: t.dueDate, priority: t.priority })),
            assignmentsCount: assignments.length,
            assignmentsList: assignments.map(a => ({ title: a.title, dueDate: a.dueDate, type: a.type })),
            subjectsList: subjects.map(s => s.name)
          }
        })
      });

      const data = await response.json();
      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('No reply received from AI server');
      }
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "I'm having a little trouble connecting to the AI server right now. Please check your internet connection or try again in a moment!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const studentPrompts = [
    "How should I prioritize my pending tasks today?",
    "Explain integration by parts step by step",
    "Give me 3 study tips for upcoming quizzes",
    "Help me draft an essay outline"
  ];

  const teacherPrompts = [
    "Suggest 3 quiz questions for Mathematics",
    "How can I help students struggling with deadlines?",
    "Draft a grading rubric for a research paper",
    "Summarize my course assignments"
  ];

  const quickPrompts = role === 'teacher' ? teacherPrompts : studentPrompts;

  return (
    <div id="global-ai-assistant-widget" className="fixed bottom-5 right-5 z-50">
      
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ring-2 ring-purple-300/30 active:scale-95"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide">AI Assistant</span>
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Expanded Chat Dialog Window */}
      {isOpen && (
        <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl w-[92vw] sm:w-[400px] h-[520px] flex flex-col justify-between overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 border border-purple-400/30 rounded-xl">
                <Bot className="w-5 h-5 text-purple-300" />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  AI Study Assistant
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30">
                    Gemini 3.6
                  </span>
                </h3>
                <p className="text-[10px] text-indigo-200/80">Always ready to answer questions & guide study</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Clear Chat History"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    AI
                  </div>
                )}
                <div className="space-y-1 max-w-[82%]">
                  <div
                    className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-2xs font-medium'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className={`block text-[9px] text-slate-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic bg-white p-2.5 rounded-2xl border border-slate-200 max-w-[70%]">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-600" />
                <span>AI Assistant is generating response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200/60 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border border-slate-200 hover:border-purple-200 text-[10px] font-semibold rounded-lg transition-all shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask AI study question or task advice..."
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

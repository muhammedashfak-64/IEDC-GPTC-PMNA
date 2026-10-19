'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  link?: { label: string; url: string };
}

const faqDatabase: { keywords: string[]; answer: string; link?: { label: string; url: string } }[] = [
  {
    keywords: ['iedc', 'what is', 'about'],
    answer: 'IEDC stands for Innovation and Entrepreneurship Development Centre. At Govt Polytechnic College Perinthalmanna, we provide students with prototype funding, hardware labs, pitch training, and KSUM startup incubation.',
    link: { label: 'Explore Incubator Hub', url: '/startups' }
  },
  {
    keywords: ['certificate', 'verify', 'download'],
    answer: 'You can verify or download any official IEDC certificate by entering your Certificate ID or Register Number on our automated Certificate Portal!',
    link: { label: 'Verify Certificate Now', url: '/verify' }
  },
  {
    keywords: ['nodal', 'coordinator', 'faculty', 'rashid'],
    answer: 'Prof. Muhammed Rashid (Department of Electronics Engineering) is the Nodal Officer of IEDC GPTC PMNA. Prof. Anupama K (Computer Engineering) serves as Assistant Nodal Officer.',
    link: { label: 'View Executive Roster', url: '/#about' }
  },
  {
    keywords: ['event', 'hackathon', 'register', 'bootcamp'],
    answer: 'We have upcoming events including the GPTC PMNA Hackathon 2026 and ESP32 Firmware Bootcamp! You can reserve your seat directly with zero registration fee.',
    link: { label: 'View Upcoming Events', url: '/events' }
  },
  {
    keywords: ['idea', 'submit', 'yip', 'funding'],
    answer: 'Students can submit innovative project ideas through the Innovation Portal to get assigned a faculty mentor and apply for Kerala Startup Mission grants.',
    link: { label: 'Submit Innovation Idea', url: '/innovation' }
  },
  {
    keywords: ['equipment', 'lab', '3d printer', 'arduino'],
    answer: 'Registered student members can reserve lab equipment like 3D Printers, Soldering Stations, and ESP32 Kits directly from the Member Dashboard.',
    link: { label: 'Go to Member Dashboard', url: '/dashboard' }
  }
];

export const AIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello! I am Antigravity AI, the official student assistant for IEDC GPTC Perinthalmanna. How can I help you today?'
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsgText = input.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userMsgText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const lower = userMsgText.toLowerCase();
      const matched = faqDatabase.find((item) =>
        item.keywords.some((kw) => lower.includes(kw))
      );

      if (matched) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: matched.answer,
            link: matched.link
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: `I understand you are asking about "${userMsgText}". For detailed assistance, you can submit an idea in the Innovation Portal or visit our Helpdesk in Block B hardware lab.`,
            link: { label: 'Go to Innovation Portal', url: '/innovation' }
          }
        ]);
      }
    }, 600);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full btn-primary-iedc p-0.5 glow-orange shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
      >
        <div className="w-full h-full bg-[#201547] rounded-full flex items-center justify-center relative">
          <Bot className="w-7 h-7 text-[#F98A5B]" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#EC3A74] border-2 border-[#201547] animate-ping" />
        </div>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl glass-iedc border border-[#F98A5B]/30 shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#201547] to-[#6249A3] p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#F98A5B]/20 flex items-center justify-center border border-[#F98A5B]/40">
                <Bot className="w-4 h-4 text-[#F98A5B]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1">
                  IEDC AI Assistant <Sparkles className="w-3 h-3 text-[#EC3A74]" />
                </h3>
                <p className="text-[10px] text-[#F98A5B] font-mono">GPTC PMNA Knowledge Bot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-[#201547]/80 border-b border-white/10 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
            <button
              onClick={() => { setInput('How to verify certificate?'); }}
              className="px-2.5 py-1 rounded-full bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30 hover:bg-[#F98A5B]/25"
            >
              Certificates?
            </button>
            <button
              onClick={() => { setInput('Who is the Nodal Officer?'); }}
              className="px-2.5 py-1 rounded-full bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30 hover:bg-[#F98A5B]/25"
            >
              Coordinators?
            </button>
            <button
              onClick={() => { setInput('Upcoming hackathons?'); }}
              className="px-2.5 py-1 rounded-full bg-[#F98A5B]/15 text-[#F98A5B] border border-[#F98A5B]/30 hover:bg-[#F98A5B]/25"
            >
              Hackathons?
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-[#F98A5B]/20 flex items-center justify-center shrink-0 border border-[#F98A5B]/30">
                    <Bot className="w-3.5 h-3.5 text-[#F98A5B]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'btn-primary-iedc text-white rounded-br-none'
                      : 'bg-[#201547]/90 border border-white/15 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  {msg.link && (
                    <Link
                      href={msg.link.url}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold text-[#F98A5B] hover:text-white underline"
                    >
                      <span>{msg.link.label}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-3 bg-[#201547] border-t border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about IEDC..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#201547]/90 border border-white/20 focus:border-[#F98A5B] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-xl btn-primary-iedc text-white hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

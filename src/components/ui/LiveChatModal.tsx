"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, ShieldCheck, CheckCheck, Loader2, Sparkles, PhoneCall } from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const ADMIN_WHATSAPP = "+880 1957-060531";
const ADMIN_WHATSAPP_LINK = "https://wa.me/8801957060531?text=Hello%20Motoplex%20Showroom%20Admin%2C%20I%20have%20an%20inquiry.";

function renderFormattedMessage(text: string) {
  // Regex to split by markdown links [label](url), bold **bold**, or whatsapp number
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(\+880\s?1957-?060531|01957-?060531))/g;

  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      const label = match[2];
      const url = match[3];
      const isInternal = url.startsWith("/");
      if (isInternal) {
        parts.push(
          <Link
            key={match.index}
            href={url}
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-black underline bg-red-50 px-2 py-0.5 rounded-md border border-red-200 text-[11px] my-0.5 shadow-2xs"
          >
            {label} →
          </Link>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-black underline bg-red-50 px-2 py-0.5 rounded-md border border-red-200 text-[11px] my-0.5 shadow-2xs"
          >
            {label} ↗
          </a>
        );
      }
    } else if (match[4]) {
      parts.push(
        <strong key={match.index} className="font-extrabold text-zinc-950">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      parts.push(
        <a
          key={match.index}
          href={ADMIN_WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs"
        >
          📱 {match[5]}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function LiveChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: `👋 Welcome to Motoplex Bangladesh Performance Division! I am your AI Parts Specialist with real-time access to our 337+ racing parts catalog.

Ask me about any product, exact price in BDT, bike fitment, workshop services, or delivery! Direct Showroom Admin WhatsApp: **${ADMIN_WHATSAPP}**.`,
      time: "Just now",
    },
  ]);

  const quickPrompts = [
    "RPD Ignition coil er dam koto?",
    "Bikers Foot rest assembly price?",
    "Bike Master Service package?",
    `Admin WhatsApp: ${ADMIN_WHATSAPP}`,
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = await response.json();
      const botReply = data.reply || `Thank you for reaching out! Please contact our Mirpur Showroom Admin directly on WhatsApp: ${ADMIN_WHATSAPP}.`;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      console.error("[Chat Error]", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `I am having trouble connecting to the showroom server right now. You can reach our specialists directly on WhatsApp at ${ADMIN_WHATSAPP}.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-6 z-40 bg-zinc-900 hover:bg-zinc-800 text-white p-3.5 rounded-full shadow-2xl border border-zinc-700 flex items-center gap-2.5 group transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open Motoplex Concierge Chat"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-900 animate-pulse" />
          </div>
          <span className="text-xs font-semibold pr-1.5 hidden md:inline-flex items-center gap-1.5">
            AI Concierge <Sparkles className="w-3 h-3 text-amber-400" />
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 w-[92vw] sm:w-[410px] bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col h-[520px] animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-red-600/20 border border-red-500 flex items-center justify-center text-red-500 font-black text-sm">
                MP
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm">Motoplex AI Concierge</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                  <span className="bg-red-950 text-red-400 border border-red-800 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <span>Mirpur 60 Feet Showroom</span>
                  <span>•</span>
                  <a
                    href={ADMIN_WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                    title="Open WhatsApp with Showroom Admin"
                  >
                    WA: {ADMIN_WHATSAPP}
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={ADMIN_WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-zinc-800 transition-colors"
                title={`Chat with Admin on WhatsApp (${ADMIN_WHATSAPP})`}
              >
                <PhoneCall className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-zinc-50 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    m.sender === "user"
                      ? "bg-red-600 text-white rounded-br-none shadow-sm"
                      : "bg-white text-zinc-800 border border-zinc-200 rounded-bl-none shadow-xs"
                  }`}
                >
                  {m.sender === "bot" ? renderFormattedMessage(m.text) : m.text}
                </div>
                <span className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1 px-1">
                  {m.time} {m.sender === "user" && <CheckCheck className="w-3 h-3 text-zinc-400" />}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-none p-3 shadow-xs text-xs text-zinc-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                  <span>AI Concierge is checking live inventory...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-white border-t border-zinc-100 flex gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-700 rounded-full transition-colors shrink-0 font-medium"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about parts, price, or fitment (English/বাংলা)..."
              disabled={isLoading}
              className="flex-1 bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
            />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-md shadow-red-600/20"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

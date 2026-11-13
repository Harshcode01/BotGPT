import React, { useRef, useState, useEffect } from "react";
import { FiMenu } from "react-icons/fi";

import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import Hero from "./components/Hero";
import ChatMessage from "./components/ChatMessage";
import ChatFooter from "./components/ChatFooter";
import TypingIndicator from "./components/TypingIndicator";

import useFreeTrial from "./hooks/useFreeTrial";
import useTypewriter from "./hooks/useTypewriter";
import useAutoScroll from "./hooks/useAutoScroll";

const FREE_LIMIT = 5;
const STORAGE_KEY = "botgpt_free_used";

// Turns the visible messages into the history format the API expects.
// System error/alert messages are left out.
const buildHistory = (messages) =>
  messages
    .filter(
      (m) =>
        typeof m.content === "string" &&
        m.content.trim() &&
        !m.content.startsWith("**System"),
    )
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.content,
    }));

// ============================================================================
// CUSTOM ROUTER
// ============================================================================
const usePathname = () => {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setPathname(path);
  };

  return { pathname, navigate };
};

// ============================================================================
// MAIN APPLICATION ROOT
// ============================================================================
export default function App() {
  const { pathname, navigate } = usePathname();

  // Route to the existing LandingPage or the new ChatApplication
  if (pathname === "/chat") {
    return <ChatApplication navigate={navigate} />;
  }

  return <LandingPage onStartChat={() => navigate("/chat")} />;
}

// ============================================================================
// ROUTE: CHAT APPLICATION ( /chat )
// ============================================================================
const ChatApplication = ({ navigate }) => {
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const [chats, setChats] = useState([
    { id: 1, title: "System Initialization", messages: [] },
  ]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [data, setData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const bottomRef = useRef(null);

  const trial = useFreeTrial(FREE_LIMIT, STORAGE_KEY);
  const typewriter = useTypewriter();
  useAutoScroll(bottomRef, { messages: data, loading, screen: 2, streaming });

  // Show the server's real remaining count on load.
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.remaining === "number") trial.applyServer(d.remaining);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle responsive sidebar on window resize
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync active chat state
  useEffect(() => {
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => (c.id === activeChatId ? { ...c, messages: data } : c)),
      );
    }
  }, [data, activeChatId]);

  const startNewChat = () => {
    setPrompt("");
    setAttachments([]);
    setActiveChatId(null);
    setData([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const loadChat = (id) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setActiveChatId(id);
      setData(chat.messages);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    }
  };

  const setLastMessageText = (content) => {
    setData((prev) => {
      const next = prev.slice();
      next[next.length - 1] = { ...next[next.length - 1], content };
      return next;
    });
  };

  const showError = (content) => {
    setLoading(false);
    setData((prev) => [...prev, { role: "ai", content }]);
  };

  async function sendPrompt() {
    const message = prompt.trim();
    if ((!message && attachments.length === 0) || loading || streaming) return;

    if (trial.isExhausted()) {
      trial.sync();
      setData((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "ai", content: "**System Alert:** Trial quota exceeded." },
      ]);
      return;
    }
    trial.consume();

    if (!activeChatId) {
      const newChat = {
        id: Date.now(),
        title: message ? message.slice(0, 30) + "..." : "New Session",
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    }

    const history = buildHistory(data);

    setData((prev) => [
      ...prev,
      { role: "user", content: message, attachments },
    ]);
    setPrompt("");
    setAttachments([]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message || "Process attached files.",
          history,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err = new Error(body.error || "failed");
        err.code = body.error || "failed";
        err.remaining = body.remaining;
        throw err;
      }

      trial.applyServer(body.remaining);
      setLoading(false);
      setStreaming(true);
      setData((prev) => [...prev, { role: "ai", content: "" }]);
      typewriter.start(setLastMessageText, () => setStreaming(false));
      typewriter.push(body.text || "");
      typewriter.finish();
    } catch (error) {
      console.error(error);
      if (error.code === "trial_exhausted") {
        trial.applyServer(0);
        showError("**System Alert:** Trial quota exceeded.");
      } else if (error.code === "busy") {
        trial.refund();
        showError(
          "**System Error:** The AI service is busy right now. Please try again in a minute.",
        );
      } else {
        trial.refund();
        showError("**System Error:** Request failed to process.");
      }
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#080B0F] text-[#E8EEF5] overflow-hidden font-geist selection:bg-[#00D5E8]/30 selection:text-[#00D5E8]">
      {/* Sidebar Drawer / Fixed */}
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={loadChat}
        onNewChat={startNewChat}
        navigate={navigate}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full min-w-0">
        {/* Header - 60px Fixed Height */}
        <header className="h-[60px] border-b border-[#202B35] flex items-center px-6 justify-between bg-[#080B0F]/95 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="text-[#8997A8] hover:text-[#E8EEF5] transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D5E8]/50 rounded-sm"
              >
                <FiMenu size={20} />
              </button>
            )}
            <span className="text-[14px] font-semibold text-[#E8EEF5] tracking-wide">
              Workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-jetbrains text-[#8997A8] bg-[#101820] border border-[#202B35] px-2.5 py-1 rounded-md shadow-sm">
              Requests: {trial.remaining}/{FREE_LIMIT}
            </span>
          </div>
        </header>

        {/* Scrollable Conversation Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {data.length === 0 ? (
            <Hero />
          ) : (
            <div className="flex flex-col pb-[160px] w-full">
              {data.map((item, index) => (
                <ChatMessage
                  key={index}
                  message={item}
                  isUser={item.role === "user"}
                  streaming={streaming && index === data.length - 1}
                />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Fixed Footer Composer */}
        <ChatFooter
          prompt={prompt}
          setPrompt={setPrompt}
          attachments={attachments}
          setAttachments={setAttachments}
          onSend={sendPrompt}
          busy={loading || streaming}
          disabled={trial.trialEnded}
        />
      </main>
    </div>
  );
};
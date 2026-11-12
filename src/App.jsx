import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import { GoogleGenAI } from "@google/genai";
import { BeatLoader } from "react-spinners";
import Markdown from "react-markdown";
import { RiComputerFill } from "react-icons/ri";
import { GiOpenBook, GiWhiteBook } from "react-icons/gi";
import { FaBloggerB, FaPaperPlane } from "react-icons/fa";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const cards = [
  { Icon: RiComputerFill, text: "Create a website using html css and js." },
  { Icon: GiWhiteBook, text: "Write a book for me. Topic is coding." },
  { Icon: GiOpenBook, text: "Tell me a comedy story." },
  { Icon: FaBloggerB, text: "Create a blog for me. Topic is web dev." },
];

const App = () => {
  const [screen, setScreen] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const chatRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, loading]);

  async function sendPrompt(text) {
    const message = text.trim();
    if (!message || loading) return;

    if (!chatRef.current) {
     chatRef.current = ai.chats.create({ model: "gemini-3.6-flash" });
    }

    setData((prev) => [...prev, { role: "user", content: message }]);
    setPrompt("");
    setScreen(2);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message });
      setData((prev) => [...prev, { role: "ai", content: response.text ?? "" }]);
    } catch (error) {
      console.error(error);
      setData((prev) => [
        ...prev,
        { role: "ai", content: "Error: the request failed. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <Navbar />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto h-full w-full max-w-4xl px-4 py-4">
          {screen === 1 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <h3 className="text-[40px] font-bold">
                Bot<span className="text-purple-500">GPT</span>
              </h3>
              <div className="mt-5 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ Icon, text }) => (
                  <div
                    key={text}
                    onClick={() => sendPrompt(text)}
                    className="cursor-pointer rounded-lg bg-zinc-800 p-4 transition-all hover:bg-zinc-700"
                  >
                    <i className="text-[30px]"><Icon /></i>
                    <p className="mt-3">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {data.map((item, index) =>
                item.role === "user" ? (
                  <div
                    key={index}
                    className="mb-4 ml-auto w-fit max-w-[85%] rounded-lg bg-purple-900/60 p-4 sm:max-w-[70%]"
                  >
                    <p className="text-[14px] text-zinc-400">You</p>
                    <p className="break-words">{item.content}</p>
                  </div>
                ) : (
                  <div
                    key={index}
                    className="mb-4 mr-auto w-fit max-w-[95%] rounded-lg bg-zinc-800 p-4 sm:max-w-[80%]"
                  >
                    <p className="text-[14px] text-zinc-400">BotGPT</p>
                    <div className="markdown break-words">
                      <Markdown>{item.content}</Markdown>
                    </div>
                  </div>
                )
              )}
              {loading && <BeatLoader color="#fff" />}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-zinc-800 bg-black px-4 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-800 pr-2">
            <input
              onKeyDown={(e) => {
                if (e.key === "Enter") sendPrompt(prompt);
              }}
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
              type="text"
              placeholder="Enter your prompt!"
              className="min-w-0 flex-1 bg-transparent p-4 text-[16px] font-medium outline-none"
            />
            <button
              onClick={() => sendPrompt(prompt)}
              disabled={loading || !prompt.trim()}
              aria-label="Send"
              className="rounded-md bg-purple-600 p-3 transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaPaperPlane />
            </button>
          </div>
          <p className="mt-2 text-center text-[13px] text-zinc-500">
            BotGPT can make mistakes! Cross-check it.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
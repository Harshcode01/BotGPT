import React, { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FiPaperclip } from "react-icons/fi";

const CodeBlock = ({ language, code, streaming }) => (
  <div className="my-5 border border-[#202B35] rounded-xl overflow-hidden bg-[#080B0F]">
    <div className="flex items-center justify-between border-b border-[#202B35] px-4 py-2.5 bg-[#0B1016]">
      <span className="text-[11px] font-jetbrains text-[#8997A8] uppercase tracking-wide">
        {language || 'plaintext'}
      </span>
    </div>
    {streaming ? (
      <pre className="p-5 text-[14px] font-jetbrains text-[#E8EEF5] overflow-x-auto custom-scrollbar">
        {code}
      </pre>
    ) : (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{ margin: 0, background: "transparent", padding: "1.25rem", fontSize: "14px", fontFamily: "'JetBrains Mono', monospace", borderRadius: "0" }}
      >
        {code}
      </SyntaxHighlighter>
    )}
  </div>
);

const ChatMessage = ({ message, isUser, streaming = false }) => {
  const components = {
    pre({ children }) { return <>{children}</>; },
    code({ className, children, ...props }) {
      const text = String(children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(className || "");
      if (match || text.includes("\n")) {
        return <CodeBlock language={match ? match[1] : "text"} code={text} streaming={streaming} />;
      }
      return <code className="bg-[#101820] border border-[#202B35] px-1.5 py-0.5 rounded-md font-jetbrains text-[13px] text-[#00D5E8]" {...props}>{children}</code>;
    },
    p({ children }) { return <p className="mb-5 last:mb-0 leading-[1.6] text-[15.5px]">{children}</p>; },
    ul({ children }) { return <ul className="list-disc ml-6 mb-5 space-y-1.5 text-[15.5px] leading-[1.6]">{children}</ul>; },
    ol({ children }) { return <ol className="list-decimal ml-6 mb-5 space-y-1.5 text-[15.5px] leading-[1.6]">{children}</ol>; },
    strong({ children }) { return <strong className="font-semibold text-[#E8EEF5]">{children}</strong>; },
    a({ children, href }) { return <a href={href} target="_blank" rel="noreferrer" className="text-[#00D5E8] hover:underline underline-offset-4 focus:outline-none focus:ring-1 focus:ring-[#00D5E8] rounded-sm">{children}</a>; },
    h1({ children }) { return <h1 className="text-[28px] font-semibold text-[#E8EEF5] mb-4 mt-8 tracking-tight">{children}</h1>; },
    h2({ children }) { return <h2 className="text-[22px] font-semibold text-[#E8EEF5] mb-4 mt-8 tracking-tight">{children}</h2>; },
    h3({ children }) { return <h3 className="text-[18px] font-semibold text-[#E8EEF5] mb-3 mt-6 tracking-tight">{children}</h3>; },
  };

  return (
    <div className={`w-full flex justify-center py-8 border-b border-[#202B35] ${isUser ? 'bg-[#0B1016]' : 'bg-transparent'}`}>
      <div className="w-full max-w-[850px] px-4 sm:px-6 flex gap-5">
        
        {/* Minimal Developer Avatar */}
        <div className="shrink-0 pt-0.5">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shadow-sm
            ${isUser ? 'bg-[#FF7043]/10 border-[#FF7043]/30' : 'bg-[#00D5E8]/10 border-[#00D5E8]/30'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${isUser ? 'bg-[#FF7043]' : 'bg-[#00D5E8]'}`} />
          </div>
        </div>
        
        <div className="flex-1 min-w-0 text-[#E8EEF5]">
          {isUser && message.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {message.attachments.map((f, i) => (
                <div key={i} className="text-[12px] font-jetbrains text-[#FF7043] border border-[#FF7043]/20 px-2 py-1 rounded bg-[#FF7043]/5 flex items-center gap-1.5">
                   <FiPaperclip size={13} /> {f.name}
                </div>
              ))}
            </div>
          )}
          
          <div className="markdown-body">
            {isUser ? (
              <p className="whitespace-pre-wrap leading-[1.6] text-[15.5px]">{message.content}</p>
            ) : (
              <Markdown remarkPlugins={[remarkGfm]} components={components}>
                {message.content}
              </Markdown>
            )}
            {streaming && <span className="inline-block w-2 h-4 bg-[#00D5E8] ml-1.5 animate-pulse align-middle" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ChatMessage);
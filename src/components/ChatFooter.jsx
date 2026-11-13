import React from "react";
import ChatInput from "./ChatInput";

const ChatFooter = ({ prompt, setPrompt, attachments, setAttachments, onSend, busy, disabled }) => (
  <footer className="absolute bottom-0 w-full px-4 pb-6 pt-12 bg-gradient-to-t from-[#080B0F] via-[#080B0F]/95 to-transparent pointer-events-none z-10">
    <div className="w-full max-w-[900px] mx-auto pointer-events-auto">
      <ChatInput
        value={prompt}
        onChange={setPrompt}
        attachments={attachments}
        setAttachments={setAttachments}
        onSend={onSend}
        disabled={disabled}
        busy={busy}
      />
      <div className="text-center mt-2.5">
        <span className="text-[11px] text-[#5B6B7C] font-jetbrains tracking-wide">
          Shift + Enter for new line • Enter to send
        </span>
      </div>
    </div>
  </footer>
);

export default ChatFooter;
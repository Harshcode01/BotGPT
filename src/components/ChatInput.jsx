import React, { useLayoutEffect, useRef } from "react";
import { FiPaperclip, FiArrowUp, FiX } from "react-icons/fi";

const MAX_HEIGHT = 200;

const ChatInput = ({ value, onChange, onSend, disabled, busy, attachments, setAttachments }) => {
  const fieldRef = useRef(null);
  const fileInputRef = useRef(null);

  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_HEIGHT) + "px";
  }, [value]);

  const canSend = !disabled && !busy && (value.trim().length > 0 || attachments.length > 0);

  const submit = () => {
    if (canSend) onSend(value, attachments);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
    e.target.value = '';
  };

  return (
    <div className="bg-[#0B1016] border border-[#202B35] rounded-xl flex flex-col focus-within:border-[#00D5E8]/40 focus-within:ring-1 focus-within:ring-[#00D5E8]/40 transition-all shadow-lg">
      
      {attachments?.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 border-b border-[#202B35]">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#080B0F] px-2.5 py-1.5 rounded-md border border-[#202B35]">
              <FiPaperclip size={14} className="text-[#00D5E8]" />
              <span className="truncate max-w-[150px] text-[12px] font-jetbrains text-[#E8EEF5]">{file.name}</span>
              <button 
                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} 
                className="text-[#8997A8] hover:text-[#FF7043] ml-1 transition-colors p-0.5 rounded focus:outline-none focus:bg-[#202B35]"
                aria-label="Remove attachment"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end p-2 gap-2 min-h-[68px]">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="p-3 text-[#8997A8] hover:text-[#00D5E8] hover:bg-[#101820] rounded-lg transition-colors mb-0.5 focus:outline-none focus:ring-2 focus:ring-[#00D5E8]/30"
          aria-label="Attach file"
        >
          <FiPaperclip size={20} />
        </button>
        
        <textarea
          ref={fieldRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Initiate command..."
          className="flex-1 bg-transparent border-none outline-none resize-none py-3.5 text-[15px] text-[#E8EEF5] placeholder:text-[#5B6B7C] leading-relaxed custom-scrollbar max-h-[200px]"
        />

        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          className="w-11 h-11 mb-0.5 mr-1 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D5E8]/50 disabled:bg-transparent disabled:text-[#3A4A5B] bg-[#E8EEF5] text-[#080B0F] hover:bg-[#00D5E8]"
        >
          <FiArrowUp size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
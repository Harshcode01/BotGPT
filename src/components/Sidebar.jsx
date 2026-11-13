import React from 'react';
import { FiFolder, FiCode, FiSettings, FiPlus, FiMessageSquare, FiArrowLeft } from 'react-icons/fi';
import { BsLayoutSidebarInset } from 'react-icons/bs';

const Sidebar = ({ isOpen, toggle, chats, activeChatId, onSelectChat, onNewChat, navigate }) => {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={toggle}
        />
      )}
      
      {/* Sidebar Panel */}
      <aside 
        className={`fixed md:relative top-0 left-0 h-full bg-[#0B1016] border-r border-[#202B35] flex flex-col z-40 transition-transform duration-300 ease-in-out shrink-0 w-[252px]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'}`}
      >
        <div className="h-[60px] px-5 border-b border-[#202B35] flex items-center justify-between shrink-0">
          <button onClick={() => navigate('/')} className="text-[#8997A8] hover:text-[#E8EEF5] flex items-center gap-2.5 text-[13px] font-semibold transition-colors focus:outline-none focus:text-[#00D5E8]">
            <FiArrowLeft size={16} /> Return
          </button>
          <button onClick={toggle} className="text-[#8997A8] hover:text-[#E8EEF5] md:hidden p-1 transition-colors">
            <BsLayoutSidebarInset size={18} />
          </button>
        </div>
        
        <div className="p-4 shrink-0">
          <button 
            onClick={onNewChat}
            className="w-full h-[40px] bg-transparent border border-[#202B35] hover:border-[#00D5E8] hover:text-[#00D5E8] text-[#E8EEF5] rounded-lg px-3 flex items-center gap-3 text-[13px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D5E8]/50"
          >
            <FiPlus size={16} /> New Process
          </button>

          <nav className="space-y-1 mt-6">
            <NavItem icon={<FiFolder size={17} />} label="Workspace" />
            <NavItem icon={<FiCode size={17} />} label="Snippets" right={<span className="text-[10px] font-semibold text-[#00D5E8] border border-[#00D5E8]/30 bg-[#00D5E8]/10 px-1.5 py-0.5 rounded tracking-wide">PRO</span>} />
            <NavItem icon={<FiSettings size={17} />} label="Parameters" />
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto px-4 mt-2 custom-scrollbar">
          <p className="text-[11px] text-[#8997A8] font-semibold uppercase tracking-wider mb-2 px-2">Active Threads</p>
          <div className="space-y-1 pb-4">
            {chats.map(chat => (
              <button 
                key={chat.id} 
                onClick={() => onSelectChat(chat.id)}
                className={`w-full h-[40px] text-left px-3 rounded-lg text-[13px] font-medium truncate flex items-center gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00D5E8]/30
                  ${activeChatId === chat.id 
                    ? 'bg-[#00D5E8]/10 text-[#00D5E8]' 
                    : 'text-[#8997A8] hover:bg-[#101820] hover:text-[#E8EEF5]'}`}
              >
                <FiMessageSquare size={16} className="shrink-0" />
                <span className="truncate">{chat.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[52px] px-5 border-t border-[#202B35] flex items-center shrink-0 bg-[#080B0F]">
          <span className="text-[11px] font-jetbrains text-[#8997A8] uppercase tracking-wide">BotGPT Engine v2</span>
        </div>
      </aside>
    </>
  );
};

const NavItem = ({ icon, label, right }) => (
  <button className="w-full h-[40px] flex items-center justify-between px-3 text-[#8997A8] hover:bg-[#101820] hover:text-[#E8EEF5] rounded-lg transition-colors focus:outline-none focus:bg-[#101820]">
    <div className="flex items-center gap-3 text-[14px] font-medium">
      {icon} {label}
    </div>
    {right}
  </button>
);

export default Sidebar;
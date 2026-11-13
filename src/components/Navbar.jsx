import React from "react";
import { FaRobot, FaRegCircleUser } from "react-icons/fa6";

const Navbar = ({ screen, setScreen }) => {
  return (
    <nav
      className={
        screen === 0
          ? "fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/70 to-transparent"
          : "sticky top-0 z-50 border-b border-white/10 bg-[#050609]/80 backdrop-blur-md"
      }
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div
          onClick={() => setScreen(0)}
          className="flex cursor-pointer items-center gap-2.5"
        >
          <i className="text-[28px] text-[#00E5FF]">
            <FaRobot />
          </i>
          <h3 className="text-[22px] font-bold tracking-tight">
            Bot<span className="text-[#00E5FF]">GPT</span>
          </h3>
        </div>

        <div className="flex items-center gap-4">
          {screen === 0 ? (
            <button
              onClick={() => setScreen(1)}
              className="cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-semibold tracking-wide text-black transition-[scale,box-shadow] hover:scale-105 hover:shadow-[0_0_20px_rgba(0,229,255,0.45)]"
            >
              Let's Chat
            </button>
          ) : (
            <button
              onClick={() => setScreen(0)}
              className="cursor-pointer rounded-full border border-white/25 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur-md transition-[border-color,background-color] hover:border-white/60 hover:bg-white/10"
            >
              Home
            </button>
          )}
          <i className="cursor-pointer text-[24px] text-[#8A99AD] transition-colors hover:text-white">
            <FaRegCircleUser />
          </i>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
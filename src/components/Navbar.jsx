import React from "react";
import { FaRobot, FaRegCircleUser } from "react-icons/fa6";

const Navbar = () => {
  return (
    <nav className="border-b border-zinc-800">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <i className="text-[32px]"><FaRobot /></i>
          <h3 className="text-[22px] font-bold">
            Bot<span className="text-purple-500">GPT</span>
          </h3>
        </div>
        <i className="cursor-pointer text-[26px]"><FaRegCircleUser /></i>
      </div>
    </nav>
  );
};

export default Navbar;
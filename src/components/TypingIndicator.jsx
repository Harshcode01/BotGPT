import React from "react";
import { BeatLoader } from "react-spinners";

const TypingIndicator = () => (
  <div className="w-full flex justify-center py-8 border-b border-[#202B35] bg-transparent">
    <div className="w-full max-w-[850px] px-4 sm:px-6 flex gap-5">
      <div className="shrink-0 pt-0.5">
        <div className="w-8 h-8 rounded-lg border border-[#00D5E8]/30 bg-[#00D5E8]/10 flex items-center justify-center shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00D5E8] animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <BeatLoader color="#00D5E8" size={6} margin={3} speedMultiplier={0.7} />
      </div>
    </div>
  </div>
);

export default TypingIndicator;
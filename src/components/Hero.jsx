import React from "react";

const Hero = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center h-full px-4 -mt-10">
      <div className="w-12 h-12 border border-[#202B35] bg-[#0B1016] rounded-xl flex items-center justify-center mb-6 shadow-sm">
        <div className="w-4 h-4 rounded-[4px] bg-[#00D5E8]/10 border border-[#00D5E8]/50 flex items-center justify-center">
           <div className="w-1.5 h-1.5 bg-[#00D5E8] rounded-full shadow-[0_0_8px_#00D5E8]" />
        </div>
      </div>
      
      <h1 className="text-[28px] font-semibold text-[#E8EEF5] mb-2 tracking-tight">
        System Ready
      </h1>
      
      <p className="text-[#8997A8] text-[15px] mb-8">
        Enter parameters, snippets, or standard queries below.
      </p>
    </div>
  );
};

export default Hero;
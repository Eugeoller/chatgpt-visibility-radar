
import React from 'react';

const ReportPageHeader = () => {
  return (
    <header className="bg-navy/90 backdrop-blur-sm py-4 border-b border-white/10">
      <div className="container-custom">
        <div className="flex items-center justify-center">
          <span className="text-2xl font-extrabold text-white">
            Seo<span className="text-blue-bright">ChatGPT</span>
            <div className="inline-block relative -top-1 -right-1 w-2 h-2 bg-blue-bright rounded-full animate-pulse-slow ml-1"></div>
          </span>
        </div>
      </div>
    </header>
  );
};

export default ReportPageHeader;

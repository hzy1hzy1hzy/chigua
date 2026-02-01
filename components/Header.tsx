
import React from 'react';

const Header: React.FC = () => {
  const date = new Date();
  const dateString = date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            🍉 吃瓜日报 <span className="text-green-500">Pro</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            📅 {dateString} | 🚀 Gemini 3 强力驱动
          </p>
        </div>
        <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-xs font-semibold border border-green-100 self-start">
          AI 实时热榜总结
        </div>
      </div>
    </header>
  );
};

export default Header;

import React from 'react';

interface HeaderProps {
  lastUpdated?: Date | null;
}

const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
  const date = new Date();
  const dateString = date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    weekday: 'long' 
  });

  const timeString = lastUpdated 
    ? lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : "准备就绪";

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            🍉 吃瓜日报
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            📅 {dateString} | 🚀 Gemini 3 强力驱动
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 text-xs font-semibold border border-green-100">
            热搜实时同步中
          </div>
          <p className="text-[10px] text-gray-400 font-mono">
            {lastUpdated ? `最后更新: ${timeString}` : "等待数据采摘..."}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
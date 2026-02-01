
import React, { useState } from 'react';
import { RawResults } from '../types';

interface TabViewProps {
  report: string;
  rawResults: RawResults;
  isLoading: boolean;
}

const TabView: React.FC<TabViewProps> = ({ report, rawResults, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'raw'>('report');

  // Simple Markdown-like renderer for better visual impact
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headings
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-black text-gray-900 mt-6 mb-2 flex items-center gap-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black text-gray-900 mt-8 mb-4 border-l-4 border-green-500 pl-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-gray-900 mt-10 mb-6">{line.replace('# ', '')}</h1>;
      
      // Blockquotes
      if (line.startsWith('> ')) return (
        <blockquote key={i} className="border-l-4 border-green-200 bg-green-50/30 p-4 italic text-gray-700 my-4 rounded-r-xl font-medium">
          {line.replace('> ', '')}
        </blockquote>
      );
      
      // Horizontal Rule or Separator (Custom detection for Emoji dividers)
      if (line.includes('━') || line.includes('---')) return <hr key={i} className="my-6 border-none text-center before:content-[attr(data-content)] opacity-30 h-px bg-gray-200" data-content={line} />;

      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return <li key={i} className="ml-6 list-disc mb-1 text-gray-700">{line.trim().substring(2)}</li>;
      }

      // Bold text handling (Simple **text** -> strong)
      const parts = line.split(/(\*\*.*?\*\*)/);
      const renderedLine = parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-black text-gray-900 underline decoration-green-300 underline-offset-2">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={i} className="min-h-[1.5em] mb-2">{renderedLine}</p>;
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="flex bg-gray-50/50 p-2">
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 py-4 text-sm font-black transition-all rounded-2xl ${
            activeTab === 'report' ? 'bg-white shadow-sm text-green-600 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          📑 幽默吃瓜日报
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`flex-1 py-4 text-sm font-black transition-all rounded-2xl ${
            activeTab === 'raw' ? 'bg-white shadow-sm text-green-600 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          📊 原始瓜田概览
        </button>
      </div>

      <div className="p-8">
        {activeTab === 'report' ? (
          <div className="max-w-none">
            {isLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-12 bg-gray-200 rounded-2xl w-full mt-8"></div>
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="text-gray-800 leading-relaxed font-normal text-lg">
                {report ? renderFormattedText(report) : (
                  <div className="text-center py-20">
                    <span className="text-6xl mb-4 block animate-bounce">🍉</span>
                    <p className="text-gray-400 font-bold">主编大人正在赶来的路上，请先开启今日瓜田...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(rawResults).map(([source, items]) => (
              <div key={source} className="flex flex-col border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-black text-gray-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                    {source}
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Live Update</span>
                </div>
                <div className="p-2 max-h-[500px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 p-3 hover:bg-gray-50 transition-all rounded-xl group relative">
                      <span className={`w-6 text-center font-black italic shrink-0 text-lg ${idx < 3 ? 'text-red-500' : 'text-orange-400'}`}>
                        {idx + 1}
                      </span>
                      
                      <div className="flex-1 flex flex-col gap-1">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-gray-800 font-bold group-hover:text-red-600 transition-colors flex items-center gap-2"
                        >
                          <span className="break-all">{item.title}</span>
                          {item.tag && (
                            <span className={`px-1 rounded text-[10px] font-black text-white shrink-0 ${
                              item.tag === '新' ? 'bg-red-400' : 
                              item.tag === '热' ? 'bg-orange-400' : 
                              item.tag === '爆' ? 'bg-red-600' : 'bg-blue-400'
                            }`}>
                              {item.tag}
                            </span>
                          )}
                        </a>
                        {item.hotness && (
                          <span className="text-xs font-medium text-gray-400 font-mono">
                            {item.hotness}
                          </span>
                        )}
                      </div>

                      <svg className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity self-center" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(rawResults).length === 0 && (
              <div className="col-span-2 py-20 flex flex-col items-center justify-center text-gray-300 gap-4">
                <span className="text-6xl opacity-30">📭</span>
                <p className="font-bold">暂无瓜田数据，请先开始采摘</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabView;

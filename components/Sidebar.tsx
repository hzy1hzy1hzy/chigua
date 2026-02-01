
import React, { useRef } from 'react';
import { NewsSource, AppMode } from '../types';

interface SidebarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  selectedSources: NewsSource[];
  onToggleSource: (source: NewsSource) => void;
  onReset: () => void;
  onImageUpload: (file: File) => void;
  uploadedImage: {preview: string} | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeMode, 
  onModeChange, 
  selectedSources, 
  onToggleSource, 
  onReset, 
  onImageUpload, 
  uploadedImage 
}) => {
  const sources: NewsSource[] = ['微博热搜', '抖音热搜'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <aside className="w-full md:w-80 bg-white border-r border-gray-100 p-6 flex flex-col shrink-0">
      <div className="flex-1">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 text-center border-b border-gray-50 pb-4">
          Data Input Configuration
        </h2>
        
        {/* Mode Selector - Card Style */}
        <div className="space-y-3 mb-10">
          <label className="text-xs font-black text-gray-800 ml-1">🚀 选择分析模式</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => onModeChange('traditional')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                activeMode === 'traditional' 
                ? 'border-green-500 bg-green-50/50 shadow-sm ring-4 ring-green-500/5' 
                : 'border-gray-50 bg-gray-50/50 text-gray-400 grayscale hover:grayscale-0 hover:bg-gray-100'
              }`}
            >
              <div className={`text-2xl p-2 rounded-xl ${activeMode === 'traditional' ? 'bg-white shadow-sm' : ''}`}>🌐</div>
              <div>
                <p className={`text-sm font-black ${activeMode === 'traditional' ? 'text-gray-900' : 'text-gray-400'}`}>实时抓取</p>
                <p className="text-[10px] opacity-60">自动获取全网最新热点</p>
              </div>
            </button>

            <button 
              onClick={() => onModeChange('screenshot')}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                activeMode === 'screenshot' 
                ? 'border-green-500 bg-green-50/50 shadow-sm ring-4 ring-green-500/5' 
                : 'border-gray-50 bg-gray-50/50 text-gray-400 grayscale hover:grayscale-0 hover:bg-gray-100'
              }`}
            >
              <div className={`text-2xl p-2 rounded-xl ${activeMode === 'screenshot' ? 'bg-white shadow-sm' : ''}`}>📸</div>
              <div>
                <p className={`text-sm font-black ${activeMode === 'screenshot' ? 'text-gray-900' : 'text-gray-400'}`}>截图直达</p>
                <p className="text-[10px] opacity-60">由 Gemini 视觉引擎识别内容</p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Content based on mode */}
        <div className="bg-gray-50/50 rounded-3xl p-5 border border-gray-50 min-h-[260px]">
          {activeMode === 'traditional' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">选择平台</span>
                <span className="text-[10px] font-bold text-green-500 bg-green-100 px-1.5 py-0.5 rounded">AUTO FETCH</span>
              </div>
              <div className="space-y-2">
                {sources.map(source => (
                  <label key={source} className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-all ${
                    selectedSources.includes(source) 
                    ? 'border-white bg-white shadow-md text-gray-900' 
                    : 'border-transparent bg-gray-100/50 text-gray-400 hover:bg-gray-100'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={selectedSources.includes(source)}
                      onChange={() => onToggleSource(source)}
                      className="hidden"
                    />
                    <span className="text-xl">{source === '微博热搜' ? '🔥' : '🎵'}</span>
                    <span className="text-sm font-black">{source}</span>
                    {selectedSources.includes(source) && <span className="ml-auto text-green-500">✓</span>}
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">上传素材</span>
                <span className="text-[10px] font-bold text-purple-500 bg-purple-100 px-1.5 py-0.5 rounded">VISION AI</span>
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[180px] overflow-hidden relative ${
                  uploadedImage ? 'border-green-500 bg-white' : 'border-gray-200 hover:border-green-400 bg-gray-100/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*"
                />
                
                {uploadedImage ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img src={uploadedImage.preview} alt="Upload preview" className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-white px-4 py-2 rounded-full text-xs font-black text-gray-900 shadow-xl">更换截图</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-3 opacity-20 group-hover:scale-110 transition-transform">📄</div>
                    <p className="text-[10px] font-black text-center text-gray-400 leading-relaxed px-4">
                      点此上传微博、抖音等平台<br/>热搜榜单截图
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50 space-y-3">
        <button 
          onClick={onReset}
          className="w-full py-4 px-4 bg-gray-50 text-gray-500 text-xs font-black rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center gap-2 group border border-transparent hover:border-red-100"
        >
          <span className="group-hover:rotate-180 transition-transform duration-500">🗑️</span>
          清空所有瓜田数据
        </button>
        
        <div className="p-5 bg-gray-900 rounded-[2rem] text-white/90">
          <p className="text-[9px] font-black text-green-400 mb-2 uppercase tracking-[0.2em]">Usage Note</p>
          <p className="text-[10px] leading-[1.6] opacity-60 font-medium">
            {activeMode === 'screenshot' 
              ? '截图模式依赖视觉解析，请确保文字清晰无遮挡。' 
              : '传统模式汇总全网动态，适合快速了解大盘趋势。'}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

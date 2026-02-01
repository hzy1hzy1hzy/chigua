import React, { useState, useCallback } from 'react';
import { generateGossipReport, parseHotSearchFromImage, fetchAllLiveTrends } from './services/geminiService';
import { AppStatus, RawResults, NewsSource, HotItem, AppMode } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatusIndicator from './components/StatusIndicator';
import TabView from './components/TabView';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>('traditional');
  const [selectedSources, setSelectedSources] = useState<NewsSource[]>(['微博热搜']);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [report, setReport] = useState<string>("");
  const [rawResults, setRawResults] = useState<RawResults>({});
  const [searchSources, setSearchSources] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<{data: string, type: string, preview: string} | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleReset = useCallback(() => {
    setReport("");
    setRawResults({});
    setSearchSources([]);
    setStatus(AppStatus.IDLE);
    setErrorMessage("");
    setUploadedImage(null);
    setLastUpdated(null);
  }, []);

  const startAnalysis = async () => {
    setErrorMessage("");
    setStatus(activeMode === 'screenshot' ? AppStatus.PROCESSING_IMAGE : AppStatus.FETCHING);
    setSearchSources([]);
    
    try {
      let finalResults: RawResults = {};
      let allGroundingSources: any[] = [];

      if (activeMode === 'screenshot') {
        if (!uploadedImage) throw new Error("⚠️ 请先在左侧上传热搜榜单截图");
        finalResults = await parseHotSearchFromImage(uploadedImage.data, uploadedImage.type);
      } else {
        if (selectedSources.length === 0) throw new Error("⚠️ 请至少选择一个采摘平台");
        // 优化：合并为一个请求
        const { results, groundingSources } = await fetchAllLiveTrends(selectedSources);
        finalResults = results;
        allGroundingSources = groundingSources;
      }

      setRawResults(finalResults);
      setSearchSources(allGroundingSources);
      setLastUpdated(new Date());
      setStatus(AppStatus.ANALYZING);
      
      const aiReport = await generateGossipReport(finalResults);
      setReport(aiReport);
      setStatus(AppStatus.COMPLETED);
    } catch (error: any) {
      console.error("Analysis failed:", error);
      setErrorMessage(error.message || "分析失败，请稍后重试");
      setStatus(AppStatus.ERROR);
    }
  };

  const onImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const fullData = e.target?.result as string;
      const base64 = fullData.split(',')[1];
      setUploadedImage({ data: base64, type: file.type, preview: fullData });
      setActiveMode('screenshot');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 transition-colors duration-300">
      <Sidebar 
        activeMode={activeMode}
        onModeChange={(m) => { setActiveMode(m); setErrorMessage(""); }}
        selectedSources={selectedSources} 
        onToggleSource={(s) => {
          setSelectedSources(prev => 
            prev.includes(s) ? prev.filter(item => item !== s) : [...prev, s]
          );
        }}
        onReset={handleReset}
        onImageUpload={onImageUpload}
        uploadedImage={uploadedImage}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <Header lastUpdated={lastUpdated} />
        
        <div className="p-4 md:p-10 max-w-6xl mx-auto w-full">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 text-center md:text-left">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 justify-center md:justify-start">
                  {activeMode === 'screenshot' ? '📸 截图解析模式' : '🌐 平台实时采摘'}
                  <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Live</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeMode === 'screenshot' 
                    ? '已为您准备好视觉引擎，只需点击下方按钮即可识别图中内容。' 
                    : '我们将通过 Google Search 实时查询全网当前最真实的热点趋势。'}
                </p>
              </div>
              {lastUpdated && status !== AppStatus.FETCHING && (
                <button 
                  onClick={startAnalysis}
                  className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors px-3 py-1.5 bg-green-50 rounded-lg"
                >
                  <span className="animate-spin-slow text-sm">🔄</span> 强制刷新瓜田
                </button>
              )}
            </div>

            <button
              onClick={startAnalysis}
              disabled={status === AppStatus.FETCHING || status === AppStatus.ANALYZING || status === AppStatus.PROCESSING_IMAGE}
              className={`w-full py-6 rounded-2xl text-xl font-black transition-all shadow-xl flex flex-col items-center justify-center gap-1 group ${
                status === AppStatus.FETCHING || status === AppStatus.ANALYZING || status === AppStatus.PROCESSING_IMAGE
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-900 hover:bg-black text-white active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center gap-3">
                {status === AppStatus.PROCESSING_IMAGE ? '🔎 视觉扫描中...' :
                 status === AppStatus.FETCHING ? '📡 正在通过搜索寻找真瓜...' : 
                 status === AppStatus.ANALYZING ? '🧠 毒舌主编正在看热搜...' : 
                 activeMode === 'screenshot' ? '✨ 解析截图并生成日报' : '🚀 抓取并生成吃瓜日报'}
              </div>
              <span className="text-[10px] font-bold tracking-widest opacity-40 group-hover:opacity-100 transition-opacity uppercase">
                Powered by Gemini 3 Flash Search
              </span>
            </button>
          </div>

          <StatusIndicator status={status} error={errorMessage} />

          {(status !== AppStatus.IDLE || errorMessage || Object.keys(rawResults).length > 0) && (
            <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4">
              <TabView 
                report={report} 
                rawResults={rawResults} 
                searchSources={searchSources}
                isLoading={status === AppStatus.ANALYZING || status === AppStatus.PROCESSING_IMAGE || status === AppStatus.FETCHING} 
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
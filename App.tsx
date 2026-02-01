import React, { useState, useCallback } from 'react';
import { generateGossipReport, parseHotSearchFromImage } from './services/geminiService';
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
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<{data: string, type: string, preview: string} | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleReset = useCallback(() => {
    setReport("");
    setRawResults({});
    setStatus(AppStatus.IDLE);
    setErrorMessage("");
    setUploadedImage(null);
    setLastUpdated(null);
  }, []);

  const fetchMockHotData = async (source: NewsSource): Promise<HotItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const encodeSearch = (q: string) => encodeURIComponent(q);
    
    // 增加随机偏移量，模拟榜单的热度跳动
    const drift = () => Math.floor(Math.random() * 20000) - 10000;

    if (source === '微博热搜') {
      const baseData = [
        { title: "名侦探柯南声明", hotness: (2071926 + drift()).toString(), tag: "爆" },
        { title: "微博之夜 官宣阵容", hotness: (1597149 + drift()).toString(), tag: "热" },
        { title: "国产电力心脏全球爆单", hotness: (904994 + drift()).toString(), tag: "新" },
        { title: "周杰伦演唱会 抢票", hotness: (852331 + drift()).toString(), tag: "热" },
        { title: "美团外卖周末半价吃大餐", hotness: "推荐", tag: "商" },
        { title: "中国最新富豪榜出炉", hotness: (694746 + drift()).toString(), tag: "新" },
        { title: "原来这就是极简主义生活", hotness: (542110 + drift()).toString(), tag: "暖" },
        { title: "冬天的第一根冰糖葫芦", hotness: (410229 + drift()).toString(), tag: "新" },
        { title: "猫咪也会因为害羞躲起来吗", hotness: (320118 + drift()).toString(), tag: "荐" },
        { title: "打工人周五的心情", hotness: (298774 + drift()).toString(), tag: "新" }
      ];
      return baseData.map(d => ({
        ...d,
        url: `https://s.weibo.com/weibo?q=${encodeSearch(d.title)}`
      }));
    } else {
      const baseData = [
        { title: "全网挑战这个丝滑小连招", hotness: `🔥 ${1200 + Math.floor(Math.random() * 50)}w`, tag: "热" },
        { title: "这就是生活中的小确幸吧", hotness: `💖 ${800 + Math.floor(Math.random() * 50)}w`, tag: "荐" },
        { title: "假如动物会说话", hotness: `🎭 ${700 + Math.floor(Math.random() * 50)}w`, tag: "新" },
        { title: "我的家乡在冬季美如画", hotness: `❄️ ${600 + Math.floor(Math.random() * 50)}w`, tag: "热" },
        { title: "这个冬天一定要去一次哈尔滨", hotness: `🚄 ${500 + Math.floor(Math.random() * 50)}w`, tag: "爆" },
        { title: "打工人的午餐开箱", hotness: `🍱 ${400 + Math.floor(Math.random() * 50)}w`, tag: "新" },
        { title: "00后整顿职场名场面", hotness: `💼 ${300 + Math.floor(Math.random() * 50)}w`, tag: "热" },
        { title: "被这首BGM洗脑了", hotness: `🎵 ${200 + Math.floor(Math.random() * 50)}w`, tag: "新" },
        { title: "那些年我们追过的偶像剧", hotness: `📺 ${100 + Math.floor(Math.random() * 50)}w`, tag: "荐" },
        { title: "大学生组团去泰山看日出", hotness: `🌅 ${50 + Math.floor(Math.random() * 50)}w`, tag: "新" }
      ];
      return baseData.map(d => ({
        ...d,
        url: `https://www.douyin.com/search/${encodeSearch(d.title)}`
      }));
    }
  };

  const startAnalysis = async () => {
    setErrorMessage("");
    setStatus(activeMode === 'screenshot' ? AppStatus.PROCESSING_IMAGE : AppStatus.FETCHING);
    
    try {
      let finalResults: RawResults = {};

      if (activeMode === 'screenshot') {
        if (!uploadedImage) throw new Error("⚠️ 请先在左侧上传热搜榜单截图");
        finalResults = await parseHotSearchFromImage(uploadedImage.data, uploadedImage.type);
      } else {
        if (selectedSources.length === 0) throw new Error("⚠️ 请至少选择一个采摘平台");
        for (const source of selectedSources) {
          finalResults[source] = await fetchMockHotData(source);
        }
      }

      setRawResults(finalResults);
      setLastUpdated(new Date());
      setStatus(AppStatus.ANALYZING);
      const aiReport = await generateGossipReport(finalResults);
      setReport(aiReport);
      setStatus(AppStatus.COMPLETED);
    } catch (error: any) {
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
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                  {activeMode === 'screenshot' ? '📸 截图解析模式' : '🌐 平台实时采摘'}
                  <span className="text-xs font-medium bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Live</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {activeMode === 'screenshot' 
                    ? '已为您准备好视觉引擎，只需点击下方按钮即可识别图中内容。' 
                    : '我们将直接请求云端数据源，获取当前讨论度最高的关键词。'}
                </p>
              </div>
              {lastUpdated && (
                <button 
                  onClick={startAnalysis}
                  className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors px-3 py-1.5 bg-green-50 rounded-lg"
                >
                  <span className="animate-spin-slow">🔄</span> 强制刷新瓜田
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
                 status === AppStatus.FETCHING ? '📡 数据采摘中...' : 
                 status === AppStatus.ANALYZING ? '🧠 毒舌模式已开启...' : 
                 activeMode === 'screenshot' ? '✨ 解析截图并生成日报' : '🚀 抓取并生成吃瓜日报'}
              </div>
              <span className="text-[10px] font-bold tracking-widest opacity-40 group-hover:opacity-100 transition-opacity uppercase">
                Powered by Gemini 3 Flash
              </span>
            </button>
          </div>

          <StatusIndicator status={status} error={errorMessage} />

          {(status !== AppStatus.IDLE || errorMessage || Object.keys(rawResults).length > 0) && (
            <div className="mt-8 transition-all animate-in fade-in slide-in-from-bottom-4">
              <TabView report={report} rawResults={rawResults} isLoading={status === AppStatus.ANALYZING || status === AppStatus.PROCESSING_IMAGE || status === AppStatus.FETCHING} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
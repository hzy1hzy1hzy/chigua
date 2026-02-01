import { GoogleGenAI, Type } from "@google/genai";
import { RawResults, HotItem } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API Key 未配置或注入失败。请检查 Zeabur 环境变量设置并确保已移除 index.html 的 importmap。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 优化：一次性获取所有选中平台的热搜，节省 API 额度并提高速度
 */
export const fetchAllLiveTrends = async (sources: string[]): Promise<{ results: RawResults, groundingSources: any[] }> => {
  const ai = getAIClient();
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  // 更加强制性的提示词，确保模型使用 googleSearch 获取实时而非训练数据
  const prompt = `你现在是一名实时新闻采编。
  请使用 Google Search 搜索并列出当前（北京时间：${timestamp}）以下平台的实时热搜榜单前 10 名：${sources.join('、')}。
  
  请严格按照以下格式输出每个平台的数据，以便我解析：
  平台名称：[平台名]
  1. [标题] | [热度值] | [标签]
  2. [标题] | [热度值] | [标签]
  ...
  
  请确保数据是此时此刻最新的。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // 降低随机性，提高数据准确度
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const results: RawResults = {};
    const platformBlocks = text.split(/平台名称：/).filter(b => b.trim());

    platformBlocks.forEach(block => {
      const lines = block.split('\n').filter(l => l.trim());
      const sourceName = lines[0]?.replace(/[:：]/g, "").trim();
      
      if (sourceName) {
        const items: HotItem[] = lines.slice(1)
          .filter(l => l.includes('|'))
          .map(l => {
            const rawLine = l.replace(/^\d+\.\s*/, "").trim();
            const [title, hotness, tag] = rawLine.split('|').map(p => p.trim());
            const q = encodeURIComponent(title || "");
            const url = sourceName.includes("微博") 
              ? `https://s.weibo.com/weibo?q=${q}` 
              : sourceName.includes("抖音") 
                ? `https://www.douyin.com/search/${q}` 
                : `https://www.google.com/search?q=${q}`;

            return { title: title || "未知内容", hotness: hotness || "", tag: tag || "", url };
          });
        
        if (items.length > 0) {
          results[sourceName] = items;
        }
      }
    });

    // 如果没解析出东西，但有文本，尝试更宽松的解析
    if (Object.keys(results).length === 0 && text.length > 50) {
        results["实时热点"] = [{ title: "数据解析异常，但已捕获搜索结果，请查看日报", url: "#" }];
    }

    return { results, groundingSources: groundingChunks };
  } catch (error: any) {
    console.error("Live Fetch Error:", error);
    
    // 专门捕获 429 错误
    if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("⚠️ Gemini API 额度已耗尽。免费版 API 限制较高，请在 Zeabur 后台更换为付费项目 API Key 或 5 分钟后再试。");
    }
    
    throw new Error(error.message || "无法获取实时数据，请稍后重试。");
  }
};

export const parseHotSearchFromImage = async (base64Data: string, mimeType: string): Promise<RawResults> => {
  const ai = getAIClient();
  const prompt = "分析这张热搜截图，提取标题、热度、排名。以 JSON 格式返回，Key 为平台名，Value 为数组包含 title, hotness, tag。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }]
      },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    throw new Error("图片识别失败，请确保截图清晰。");
  }
};

export const generateGossipReport = async (data: RawResults): Promise<string> => {
  const ai = getAIClient();
  let formattedData = JSON.stringify(data);
  const systemInstruction = `你是一个全网最犀利、毒舌且幽默的八卦主编。根据热搜数据撰写一份《吃瓜日报》，多用 Emoji，语气要像在茶水间讲八卦。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `这是刚采摘的数据，请开始你的表演：\n${formattedData}`,
      config: { systemInstruction, temperature: 0.9 },
    });
    return response.text || "主编今天罢工了...";
  } catch (error) {
    throw new Error("日报排版失败。");
  }
};
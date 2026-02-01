import { GoogleGenAI, Type } from "@google/genai";
import { RawResults, HotItem } from "../types";

/**
 * 格式化 API 错误信息，避免输出原始 JSON 字符串
 */
const formatError = (error: any): string => {
  const message = error.message || "";
  
  // 捕获 API Key 失效
  if (message.includes("API key expired") || message.includes("API_KEY_INVALID")) {
    return "❌ 您的 API Key 已过期或无效。请前往 Google AI Studio 重新生成 Key，并在 Zeabur 环境变量中更新 API_KEY。";
  }
  
  // 捕获额度限制
  if (message.includes("429") || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
    return "⚠️ API 调用过于频繁或额度已耗尽。请稍等几分钟再试，或更换为付费版 Key。";
  }

  // 尝试解析可能被 JSON 化的错误字符串
  try {
    if (message.startsWith('{')) {
      const parsed = JSON.parse(message);
      return parsed.error?.message || "发生未知 API 错误";
    }
  } catch (e) {
    // 解析失败则按原样处理
  }

  return message || "无法获取实时数据，请稍后重试。";
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API Key 未配置。请在 Zeabur 后台添加 API_KEY 环境变量，并点击 'Redeploy'。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 优化：一次性获取所有选中平台的热搜
 */
export const fetchAllLiveTrends = async (sources: string[]): Promise<{ results: RawResults, groundingSources: any[] }> => {
  const ai = getAIClient();
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  const prompt = `你现在是一名实时新闻采编。
  请使用 Google Search 搜索并列出当前（北京时间：${timestamp}）以下平台的实时热搜榜单前 10 名：${sources.join('、')}。
  
  请严格按照以下格式输出每个平台的数据：
  平台名称：[平台名]
  1. [标题] | [热度值] | [标签]
  2. [标题] | [热度值] | [标签]
  ...`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
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

    if (Object.keys(results).length === 0 && text.length > 50) {
        results["实时热点"] = [{ title: "数据获取成功，内容已在日报中呈现", url: "#" }];
    }

    return { results, groundingSources: groundingChunks };
  } catch (error: any) {
    console.error("Live Fetch Error:", error);
    throw new Error(formatError(error));
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
    throw new Error(formatError(error));
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
    throw new Error(formatError(error));
  }
};
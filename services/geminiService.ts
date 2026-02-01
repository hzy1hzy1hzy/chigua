import { GoogleGenAI, Type } from "@google/genai";
import { RawResults, HotItem } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API Key 未配置，请在 Zeabur 环境变量中设置 API_KEY 并重新部署。");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * 使用 Google Search 获取实时热搜
 */
export const fetchLiveTrends = async (source: string): Promise<{ items: HotItem[], sources: any[] }> => {
  const ai = getAIClient();
  // 明确要求模型查询当前的实时榜单
  const prompt = `请搜索并列出当前（${new Date().toLocaleString()}）${source}的前10名。
  请严格按照以下格式输出，每行一条：
  [排名] 标题 | 热度值 | 标签(如新/热/爆/荐)
  
  请确保数据是真实的搜索结果。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // 解析模型返回的文本行
    const lines = text.split('\n').filter(line => line.includes('|'));
    const items: HotItem[] = lines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const titleWithRank = parts[0] || "";
      const title = titleWithRank.replace(/^\[\d+\]\s*/, "");
      const hotness = parts[1] || "";
      const tag = parts[2] || "";
      
      let url = "";
      const q = encodeURIComponent(title);
      if (source.includes("微博")) url = `https://s.weibo.com/weibo?q=${q}`;
      else if (source.includes("抖音")) url = `https://www.douyin.com/search/${q}`;
      else url = `https://www.google.com/search?q=${q}`;

      return { title, hotness, tag, url };
    });

    return { items, sources: groundingChunks };
  } catch (error: any) {
    console.error("Live Fetch Error:", error);
    throw new Error("无法获取实时数据，请稍后重试。");
  }
};

export const parseHotSearchFromImage = async (base64Data: string, mimeType: string): Promise<RawResults> => {
  const ai = getAIClient();
  const prompt = "请分析这张热搜榜单截图。提取其中的热搜标题、排名、热度数值和标签。请以 JSON 格式返回，Key 为平台名称，Value 为包含 title, hotness, tag, rank 的对象数组。";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    for (const source of Object.keys(result)) {
      if (Array.isArray(result[source])) {
        result[source] = result[source].map((item: any) => {
          const q = encodeURIComponent(item.title);
          const url = source.includes("微博") ? `https://s.weibo.com/weibo?q=${q}` : `https://www.douyin.com/search/${q}`;
          return { ...item, url };
        });
      }
    }
    return result;
  } catch (error) {
    throw new Error("图片识别失败。");
  }
};

export const generateGossipReport = async (data: RawResults): Promise<string> => {
  const ai = getAIClient();
  let formattedData = "";
  for (const [source, items] of Object.entries(data)) {
    formattedData += `\n【${source}】\n` + items.slice(0, 10).map((item, idx) => 
      `${idx + 1}. ${item.title} (热度: ${item.hotness || '未知'})`
    ).join('\n');
  }

  const systemInstruction = `你是一个全网最犀利的八卦主编。根据提供的数据撰写一份充满 Emoji 和幽默感的《吃瓜日报》。`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `数据：\n${formattedData}\n请撰写日报。`,
      config: {
        systemInstruction,
        temperature: 0.9,
      },
    });
    return response.text || "生成失败。";
  } catch (error) {
    throw new Error("生成报告失败。");
  }
};
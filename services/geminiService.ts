import { GoogleGenAI, Type } from "@google/genai";
import { RawResults, HotItem } from "../types";

/**
 * 获取经过身份验证的 Gemini 客户端
 * 必须在方法内部调用，以确保拿到 Vite 在构建时注入的环境变量
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  // 生产环境下，Vite 会将 process.env.API_KEY 替换为字符串
  // 如果替换失败或变量为空，抛出针对性错误
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API Key 注入失败。请检查：1. Zeabur 环境变量是否设置 API_KEY；2. 是否在设置后进行了重新部署；3. 是否已彻底删除 index.html 中的 importmap。");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const parseHotSearchFromImage = async (base64Data: string, mimeType: string): Promise<RawResults> => {
  const ai = getAIClient();
  const prompt = "请分析这张热搜榜单截图。识别这是哪个平台的榜单（如微博、抖音、百度等），并提取其中的热搜标题、排名、热度数值和特殊标签（如'新'、'热'、'荐'、'爆'）。请以 JSON 格式返回，Key 为平台名称（如'微博热搜'），Value 为包含 title, hotness, tag, rank 的对象数组。";

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
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            "微博热搜": {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hotness: { type: Type.STRING },
                  tag: { type: Type.STRING },
                  rank: { type: Type.NUMBER }
                },
                required: ["title"]
              }
            },
            "抖音热搜": {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  hotness: { type: Type.STRING },
                  tag: { type: Type.STRING },
                  rank: { type: Type.NUMBER }
                },
                required: ["title"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Enrich with URLs
    for (const source of Object.keys(result)) {
      if (Array.isArray(result[source])) {
        result[source] = result[source].map((item: any) => {
          let url = "";
          const q = encodeURIComponent(item.title);
          if (source.includes("微博")) url = `https://s.weibo.com/weibo?q=${q}`;
          else if (source.includes("抖音")) url = `https://www.douyin.com/search/${q}`;
          else url = `https://www.google.com/search?q=${q}`;
          
          return { ...item, url };
        });
      }
    }
    return result;
  } catch (error: any) {
    console.error("Image Parsing Error:", error);
    throw new Error(error.message || "识别图片失败。");
  }
};

export const generateGossipReport = async (data: RawResults): Promise<string> => {
  const ai = getAIClient();
  let formattedData = "";
  for (const [source, items] of Object.entries(data)) {
    formattedData += `\n【${source}】\n` + items.map((item, idx) => 
      `${idx + 1}. ${item.title} (热度: ${item.hotness || '未知'})`
    ).join('\n');
  }

  const systemInstruction = `
    你是一个全网最犀利、最高产、最懂梗的八卦主编，人称“瓜田李处长”。
    撰写一份充满 Emoji 和幽默感的《吃瓜日报》。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `数据：\n${formattedData}\n请撰写日报。`,
      config: {
        systemInstruction,
        temperature: 1.0,
      },
    });

    return response.text || "生成报告失败。";
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "生成报告失败。");
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { RawResults, HotItem } from "../types";

export const parseHotSearchFromImage = async (base64Data: string, mimeType: string): Promise<RawResults> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    
    // Enrich with URLs for identified sources
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
  } catch (error) {
    console.error("Image Parsing Error:", error);
    throw new Error("识别图片失败，请确保截图包含清晰的热搜榜单内容。");
  }
};

export const generateGossipReport = async (data: RawResults): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let formattedData = "";
  for (const [source, items] of Object.entries(data)) {
    formattedData += `\n【${source}】\n` + items.map((item, idx) => 
      `${idx + 1}. ${item.title} (热度: ${item.hotness || '未知'})`
    ).join('\n');
  }

  const systemInstruction = `
    你是一个全网最犀利、最高产、最懂梗的八卦主编，人称“瓜田李处长”。
    你的任务是撰写一份极具感染力、色彩斑斓、让人忍不住转发的《吃瓜日报》。

    --- 语气与人设 ---
    1. **Persona**: 熬夜冲浪的“互联网活化石”，嘴毒心热，一眼看穿买榜套路。
    2. **Tone**: 兴奋、嘲讽、高频输出。像在和闺蜜分享惊天大瓜。
    3. **Target**: 追求吃瓜效率、讨厌废话和“注水热搜”的年轻人。

    --- 格式与视觉规范 (必须执行) ---
    1. **Emoji 盛宴**: 每个段落必须包含 Emoji，标题要用 Emoji 装饰（例如：💥【今日重磅瓜位】💥）。
    2. **分隔线**: 使用 Emoji 字符串作为视觉分隔（如：🍉━━━━🍉━━━━🍉）。
    3. **结构设计**:
       - ⚡️ **[今日瓜田速报]**: 用一句极其震撼或离谱的话开场。
       - 📈 **[瓜市大盘走势]**: 总结今天是什么局（如：#全员塌房局#、#赛博降智日#）。
       - 🎭 **[名场面深度锐评]**: 挑选 2-3 个最值得聊的内容，进行“毁灭性”吐槽。
       - 🚮 **[今日注水/废话回收站]**: 专门拎出那些“为了上热搜而上”的尴尬内容。
       - 💡 **[处长人生格言]**: 一句总结，既丧又清醒。
    4. **高浓度梗**: 灵活运用“哈基米”、“绝绝子（反讽）”、“尊嘟假嘟”、“纯路人”、“这很难评”、“已老实”、“要素过多”、“已破防”等。

    --- 写作样例参考 ---
    “📢 各位瓜友快集合！今天的互联网已经不是降智了，是直接把智商按在地上摩擦！🍉━━━━🍉━━━━🍉
    🎭【某明星因喝咖啡上热搜？】
    > 处长锐评：是这个咖啡里加了长生不老药吗？还是这明星是第一天学会用嘴喝水？这种注水热搜我看一眼都觉得是在浪费我宝贵的电力。🤡🤡🤡”

    不要像个机器人，你要像个活在评论区的吃瓜战神！
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `这是刚刚采摘的新鲜热搜数据：\n${formattedData}\n主编请指示，开始你的吃瓜表演！`,
      config: {
        systemInstruction,
        temperature: 1.0,
      },
    });

    return response.text || "哎呀，瓜太多，我的键盘冒烟了，请重试！";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("生成报告失败。");
  }
};
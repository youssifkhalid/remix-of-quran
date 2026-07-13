import { createServerFn } from "@tanstack/react-start";

// Trusted Islamic sources to cite
export const TRUSTED_SOURCES = [
  { id: "quran", name: "القرآن الكريم", icon: "📖", color: "emerald" },
  { id: "bukhari", name: "صحيح البخاري", icon: "📚", color: "amber" },
  { id: "muslim", name: "صحيح مسلم", icon: "📚", color: "amber" },
  { id: "abu-dawud", name: "سنن أبي داود", icon: "📚", color: "amber" },
  { id: "tirmidhi", name: "جامع الترمذي", icon: "📚", color: "amber" },
  { id: "nasai", name: "سنن النسائي", icon: "📚", color: "amber" },
  { id: "ibn-majah", name: "سنن ابن ماجه", icon: "📚", color: "amber" },
  { id: "ibn-taymiyyah", name: "ابن تيمية", icon: "🎓", color: "blue" },
  { id: "ibn-qayyim", name: "ابن القيم", icon: "🎓", color: "blue" },
  { id: "nawawi", name: "الإمام النووي", icon: "🎓", color: "blue" },
  { id: "ibn-kathir", name: "ابن كثير (التفسير)", icon: "🎓", color: "blue" },
];

const SYSTEM_PROMPT = `أنت مساعد إسلامي متخصص اسمه "سكينة AI"، متخصص في الفقه الإسلامي والتفسير والحديث والعقيدة.

## قواعدك الثابتة:

1. **الجواب دائمًا بالعربية** الفصيحة الواضحة مع مصطلحات شرعية دقيقة.

2. **الاستدلال من المصادر الشرعية الموثوقة فقط:**
   - القرآن الكريم (مع ذكر السورة ورقم الآية)
   - الأحاديث الصحيحة: البخاري، مسلم، أبو داود، الترمذي، النسائي، ابن ماجه
   - كتب الفقه المعتمدة: المذاهب الأربعة (حنفي، مالكي، شافعي، حنبلي)
   - أقوال العلماء الثقات: ابن تيمية، ابن القيم، النووي، ابن كثير، ابن باز، ابن عثيمين

3. **تنسيق الإجابة دائمًا هكذا** (JSON فقط، لا شيء آخر):

\`\`\`json
{
  "answer": "نص الإجابة الكاملة هنا بالعربية الفصيحة، متكاملة ومفيدة",
  "sources": [
    {
      "type": "quran",
      "text": "نص الآية الكريمة",
      "ref": "سورة البقرة، الآية ٢٥٥"
    },
    {
      "type": "hadith",
      "text": "متن الحديث",
      "ref": "رواه البخاري، حديث رقم ١",
      "grade": "صحيح"
    },
    {
      "type": "scholar",
      "text": "قول العالم أو الفتوى",
      "ref": "ابن تيمية، مجموع الفتاوى"
    }
  ],
  "madhahib": "اتفق العلماء على... / خلاف: الحنفية يرون...",
  "summary": "خلاصة في جملة واحدة"
}
\`\`\`

4. **إذا كان السؤال خارج نطاق الإسلام:** أجب: {"answer":"أنا متخصص في الأسئلة الإسلامية فقط. هل لديك سؤال شرعي؟","sources":[],"summary":""}

5. **لا تفتي في المسائل الطبية أو القانونية** المعقدة، وأحل المستخدم للمختصين.

6. **الاعتدال والوسطية:** لا تتحيز لمذهب على حساب آخر دون دليل.`;

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponse {
  answer: string;
  sources: Array<{
    type: "quran" | "hadith" | "scholar";
    text: string;
    ref: string;
    grade?: string;
  }>;
  madhahib?: string;
  summary?: string;
  error?: string;
}

export const askIslamicAI = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { messages: AIChatMessage[] })
  .handler(async ({ data }): Promise<AIResponse> => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        return {
          answer:
            "لم يتم تفعيل مفتاح Gemini API بعد. يرجى إضافة متغير البيئة GEMINI_API_KEY على Vercel أو في ملف .env.local لتمكين المساعد الإسلامي.",
          sources: [],
          summary: "",
          error: "GEMINI_API_KEY not configured",
        };
      }

      // Convert conversation to Gemini contents format
      const contents = data.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const model = "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API ${response.status}: ${err.slice(0, 200)}`);
      }

      const json = await response.json();
      const raw: string =
        json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Extract JSON block (Gemini honours responseMimeType but be defensive)
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON in response");

      const parsed = JSON.parse(match[0]) as AIResponse;
      // Ensure required fields exist
      return {
        answer: parsed.answer ?? "",
        sources: Array.isArray(parsed.sources) ? parsed.sources : [],
        madhahib: parsed.madhahib,
        summary: parsed.summary ?? "",
      };
    } catch (e: any) {
      return {
        answer: "عذرًا، حدث خطأ في الاتصال بالمساعد. يرجى المحاولة مرة أخرى.",
        sources: [],
        summary: "",
        error: e?.message,
      };
    }
  });

// Suggested questions for quick start
export const SUGGESTED_QUESTIONS = [
  { emoji: "🕌", text: "ما هي شروط صحة الصلاة؟" },
  { emoji: "📿", text: "ما فضل قراءة آية الكرسي؟" },
  { emoji: "💒", text: "ما حكم الزواج في الإسلام؟" },
  { emoji: "💰", text: "ما هي أحكام الزكاة ونصابها؟" },
  { emoji: "🌙", text: "ما فضل صيام رمضان وأحكامه؟" },
  { emoji: "🤲", text: "ما هو أفضل دعاء للهم والحزن؟" },
  { emoji: "👶", text: "ما أحكام تسمية المولود في الإسلام؟" },
  { emoji: "💸", text: "ما حكم الربا وبدائله الشرعية؟" },
];

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateQuestions(params: {
  subject: string;
  grade: string;
  content: string;
  count: number;
}) {
  const { subject, grade, content, count } = params;

  const prompt = `Tạo ${count} câu hỏi trắc nghiệm cho môn ${subject}, khối ${grade} dựa trên nội dung sau:
  "${content}"
  
  Yêu cầu:
  - Câu hỏi phải bám sát chương trình GDPT 2018.
  - Đa dạng loại câu hỏi (Trắc nghiệm 4 đáp án, Đúng/Sai).
  - Ngôn ngữ: Tiếng Việt (hoặc Tiếng Anh nếu môn học là Tiếng Anh).
  - Trả về định dạng JSON mảng các đối tượng.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Nội dung câu hỏi" },
            type: { type: Type.STRING, enum: ["multiple_choice", "true_false"], description: "Loại câu hỏi" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Danh sách các lựa chọn (A, B, C, D hoặc Đúng, Sai)"
            },
            correct_answer: { type: Type.STRING, description: "Đáp án đúng (phải khớp với một trong các options)" },
            explanation: { type: Type.STRING, description: "Giải thích ngắn gọn" }
          },
          required: ["text", "type", "options", "correct_answer"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateRescueQuestion(subject: string, grade: string) {
  const prompt = `Tạo 1 câu hỏi vui hoặc kiến thức chung thú vị cho môn ${subject}, khối ${grade} để làm câu hỏi cứu trợ trong trò chơi Rung Chuông Vàng.
  Câu hỏi nên có độ khó vừa phải.
  Trả về định dạng JSON đối tượng: { text, options: [A, B, C, D], correct_answer, explanation }.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct_answer: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["text", "options", "correct_answer"]
      }
    }
  });

  return JSON.parse(response.text);
}

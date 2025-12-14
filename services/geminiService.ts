import { GoogleGenAI, Content, Part } from "@google/genai";
import { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamGeminiResponse = async (
  history: ChatMessage[],
  newMessage: string,
  newImage: string | null,
  onChunk: (text: string) => void
): Promise<string> => {
  
  // Convert internal ChatMessage format to Gemini Content format
  const contents: Content[] = history.map((msg) => {
    const parts: Part[] = [];
    
    if (msg.image) {
       // Extract base64 data and mime type
       // Assuming standard data URI format: "data:image/png;base64,..."
       const match = msg.image.match(/^data:(.+);base64,(.+)$/);
       if (match) {
         parts.push({
           inlineData: {
             mimeType: match[1],
             data: match[2],
           }
         });
       }
    }
    
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    return {
      role: msg.role,
      parts: parts,
    };
  });

  // Add the current new message to the contents
  const currentParts: Part[] = [];
  if (newImage) {
      const match = newImage.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          }
        });
      }
  }
  currentParts.push({ text: newMessage });
  
  contents.push({
    role: 'user',
    parts: currentParts
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: "You are a helpful AI assistant integrated into a scientific calculator app. You can help with math problems, analyze images of equations, or general queries. Be concise and helpful.",
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

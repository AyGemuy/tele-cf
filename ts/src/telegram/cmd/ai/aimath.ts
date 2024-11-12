import fetch from "node-fetch";

// Function to interact with AiMath API
async function AiMath(prompt: string): Promise<string | null> {
  const url = "https://aimathgpt.forit.ai/api/ai";
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    Referer: "https://aimathgpt.forit.ai/#pricing",
    "Accept-Encoding": "gzip, deflate"
  };
  const data = {
    messages: [{
      role: "system",
      content: "You are an expert math tutor. For each question, provide: 1) A clear, step-by-step problem-solving approach. 2) A concise explanation of the underlying concepts. 3) One follow-up question to deepen understanding. 4) A helpful tip or common pitfall to watch out for. Keep your responses clear and concise."
    }, {
      role: "user",
      content: prompt
    }],
    model: "llama3"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });
    
    const jsonResponse = await response.json();
    return jsonResponse?.result?.response || "No response from AI.";
  } catch (error) {
    console.error("Error in AiMath:", error);
    return "There was an error processing your math request.";
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /aimath diikuti dengan pertanyaan matematika.',
  tags: 'ai',
  command: /^aimath$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const mathAnswer = await AiMath(prompt);

      if (mathAnswer) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Solusi untuk pertanyaan Anda: \n${mathAnswer}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat memproses pertanyaan matematika."
        });
      }
    } catch (error) {
      console.error('Error during run command:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

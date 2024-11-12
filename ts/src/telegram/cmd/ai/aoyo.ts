import fetch from "node-fetch";

// Function to interact with Aoyo AI Search API
async function Aoyo(content: string): Promise<any | null> {
  try {
    const response = await fetch("https://aoyo.ai/Api/AISearch/AISearch", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: `https://aoyo.ai/search/?q=${content}&t=${Date.now()}`
      },
      body: new URLSearchParams({
        content: content
      })
    });
    
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.text();
    const extractJson = (text: string) => {
      const startIndex = text.indexOf("[START]");
      if (startIndex === -1) throw new Error("[START] not found");
      return JSON.parse(text.substring(startIndex + 7).trim());
    };

    return extractJson(data)?.data?.Response || "No response";
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /aoyo diikuti dengan pesan untuk berbicara dengan Aoyo AI.',
  tags: 'ai',
  command: /^aoyo$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const aoyoResponse = await Aoyo(prompt);

      if (aoyoResponse) {
        await tg.sendMessage({
          chat_id: chatId,
          text: aoyoResponse || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Aoyo AI."
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

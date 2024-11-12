import fetch from "node-fetch";

// Function to interact with Anshari Chat API
async function AnshariChat(message: string): Promise<any | null> {
  try {
    const url = "https://api.ansari.chat/api/v1/complete";
    const headers = {
      "Content-Type": "application/json",
      "User-Agent": "Postify/1.0.0",
      Referer: "https://ansari.chat/",
      Origin: "https://ansari.chat",
      "x-forwarded-for": new Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join(".")
    };

    const body = JSON.stringify({
      messages: [{
        role: "user",
        content: message
      }]
    });

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body
    });

    const data = await response.json();
    return data;
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
  help: 'Gunakan /anshari diikuti dengan pesan untuk berbicara dengan Anshari AI.',
  tags: 'ai',
  command: /^anshari$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const chatResponse = await AnshariChat(prompt);

      if (chatResponse && chatResponse.data) {
        await tg.sendMessage({
          chat_id: chatId,
          text: chatResponse.data || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Anshari AI."
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

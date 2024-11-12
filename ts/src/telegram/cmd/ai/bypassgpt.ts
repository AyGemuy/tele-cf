import fetch from "node-fetch";

// Function to interact with the Bypass GPT API
async function BypassGpt(prompt: string): Promise<string | null> {
  const url = "https://finechatserver.erweima.ai/api/v1/projectGpts/chat";
  const headers = {
    "Content-Type": "application/json",
    uniqueId: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    "User-Agent": "Mozilla/5.0",
    Referer: "https://bypassgpt.co",
    "Accept-Encoding": "gzip, deflate"
  };
  const data = {
    prompt: prompt,
    attachments: [],
    source: "bypassgpt.co",
    sessionId: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    const responseBody = await response.text();
    const lines = responseBody.split("\n").slice(0, -1);
    const messages = lines.map(line => {
      try {
        const jsonData = JSON.parse(line);
        return jsonData.data.message;
      } catch {
        return "";
      }
    });
    const message = messages.join("");
    return message;
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
  help: 'Gunakan /bypassgpt untuk mendapatkan jawaban dari Bypass GPT AI.',
  tags: 'ai',
  command: /^bypassgpt$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const gptResponse = await BypassGpt(prompt);

      if (gptResponse) {
        await tg.sendMessage({
          chat_id: chatId,
          text: gptResponse || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Bypass GPT AI."
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

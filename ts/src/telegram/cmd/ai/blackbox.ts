import fetch from "node-fetch";

// Utility function to generate a random chat ID (replacing crypto methods)
const generateRandomId = () => Math.random().toString(36).substring(2, 18); // Generates a short random string

// Utility function to send a chat request to the Blackbox API
const blackboxChat = async (
  messages: string[],
  userSystemPrompt: string = "You are Realtime AI. Follow the user's instructions carefully.",
  webSearchMode: boolean = true,
  playgroundMode: boolean = false,
  codeModelMode: boolean = false,
  isMicMode: boolean = false
): Promise<string | null> => {
  const chatId = generateRandomId();  // Generate random chat ID
  const userId = generateRandomId();  // Generate random user ID

  try {
    const response = await fetch("https://www.blackbox.ai/api/chat", {
      method: "POST",
      mode: "cors",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: "https://www.blackbox.ai/",
        "Content-Type": "application/json",
        Origin: "https://www.blackbox.ai",
        DNT: "1",
        "Sec-GPC": "1",
        "Alt-Used": "www.blackbox.ai",
        Connection: "keep-alive"
      },
      body: JSON.stringify({
        messages: messages,
        id: chatId,
        previewToken: null,
        userId: userId,
        codeModelMode: codeModelMode,
        agentMode: {},
        trendingAgentMode: {},
        isMicMode: isMicMode,
        userSystemPrompt: userSystemPrompt,
        maxTokens: 1024,
        playgroundMode: playgroundMode,
        webSearchMode: webSearchMode,
        promptUrls: "",
        isChromeExt: false,
        githubToken: null
      })
    });

    return await response.text();
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /blackbox diikuti dengan pesan untuk berbicara dengan Blackbox AI.',
  tags: 'ai',
  command: /^blackbox$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const messages = [prompt];
      const chatResponse = await blackboxChat(messages);

      if (chatResponse) {
        await tg.sendMessage({
          chat_id: chatId,
          text: chatResponse || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Blackbox AI."
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

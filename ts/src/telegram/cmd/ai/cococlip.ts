import fetch from "node-fetch";

const API_URL = "https://cococlip.ai/api/v1";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
  Referer: "https://cococlip.ai/features/image-to-prompt"
};
const TIMEOUT = 120000; // 120 seconds
const POLL_INTERVAL = 2000; // 2 seconds

// Function to get prompt from an image URL
async function cococlip(imageUrl: string): Promise<string> {
  try {
    // Initial request to get promptId
    const response1 = await fetch(`${API_URL}/imagetoprompt/imageclip?image=${encodeURIComponent(imageUrl)}`, {
      method: "GET",
      headers: HEADERS
    });
    const { id: promptId } = await response1.json();
    if (!promptId) throw new Error("Failed to retrieve promptId");

    // Polling for final prompt result
    const startTime = Date.now();
    while (Date.now() - startTime < TIMEOUT) {
      const response2 = await fetch(`${API_URL}/checkqueue?promptId=${promptId}`, {
        method: "GET",
        headers: HEADERS
      });
      const { nums } = await response2.json();

      if (nums === 0) {
        const response3 = await fetch(`${API_URL}/imagetoprompt/imageclippoll?promptId=${promptId}`, {
          method: "GET",
          headers: HEADERS
        });
        const { prompt } = await response3.json();
        if (prompt) return prompt;
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }

    throw new Error("Polling timed out for final result");
  } catch (error) {
    console.error("Error in cococlip:", error);
    throw error;
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  imageUrl: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /cococlip <URL gambar> untuk mendapatkan prompt dari gambar.',
  tags: 'ai',
  command: /^cococlip$/i,
  run: async function ({ imageUrl, chatId, tg }: CommandContext): Promise<void> {
    try {
      const prompt = await cococlip(imageUrl);

      if (prompt) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah prompt yang dihasilkan dari gambar:\n\n${prompt}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Gagal menghasilkan prompt dari gambar."
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

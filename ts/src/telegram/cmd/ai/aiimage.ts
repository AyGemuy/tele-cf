import fetch from "node-fetch";

// Define the response structure
interface AiImageResponse {
  data: string;
}

async function AiImageGenerator(prompt: string, key: string = "RANDOM"): Promise<string | null> {
  try {
    const createResponse = await fetch("https://aiimagegenerator.io/api/model/predict-peach", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        platform: "PC",
        product: "AI_IMAGE_GENERATOR",
        locale: "en-US",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: "https://aiimagegenerator.io/"
      },
      body: JSON.stringify({
        prompt: prompt,
        negativePrompt: "",
        key: key,
        width: 512,
        height: 768,
        quantity: 1,
        size: "512x768"
      })
    });

    if (!createResponse.ok) {
      throw new Error(`HTTP error! Status: ${createResponse.status}`);
    }

    const createData: AiImageResponse = await createResponse.json();
    const taskId = createData.data;

    if (!taskId) {
      throw new Error("Failed to create task.");
    }

    const timeout = 60000; // 1 minute timeout
    const startTime = Date.now();
    let imageUrl: string | null = null;

    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds
      try {
        const statusResponse = await fetch(`https://aiimagegenerator.io/api/model/status/${taskId}`);
        const statusData = await statusResponse.json();
        if (statusData.data?.url) {
          imageUrl = statusData.data.url;
          break;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (imageUrl) {
      return imageUrl;
    } else {
      throw new Error("Failed to generate image within the timeout period.");
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /aiimagegenerator diikuti dengan pesan untuk menghasilkan gambar AI.',
  tags: 'ai',
  command: /^aiimagegenerator$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const imageUrl = await AiImageGenerator(prompt);

      if (imageUrl) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut gambar yang dihasilkan: ${imageUrl}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Gambar tidak dapat dihasilkan, silakan coba lagi."
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

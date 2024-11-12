import fetch from "node-fetch";

// Define the response structure
interface AiArtResponse {
  images: string[];
}

const AiArtGenerator = async (prompt: string, style: string = "3D Model", model: string = "sdxl-lightning"): Promise<string[] | null> => {
  try {
    const response = await fetch("https://www.ai-art-generator.net/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user": "",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.ai-art-generator.net/playground"
      },
      body: JSON.stringify({
        prompt: prompt,
        style: style,
        model: model
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const jsonData: AiArtResponse = JSON.parse(data);
    return jsonData.images;
  } catch (error) {
    console.error("Error in AiArtGenerator:", error);
    return null;
  }
};

interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /aiartgenerator diikuti dengan pesan untuk menghasilkan gambar AI.',
  tags: 'ai',
  command: /^aiartgenerator$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const images = await AiArtGenerator(prompt);

      if (images && images.length > 0) {
        const imageUrl = images[0];  // Assuming we return the first image
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut gambar yang dihasilkan: ${imageUrl}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Tidak ada gambar yang ditemukan berdasarkan prompt Anda."
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

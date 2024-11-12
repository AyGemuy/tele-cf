import fetch from "node-fetch";

// Function to interact with Aimusic Lyrics API
async function AimusicLyrics(prompt: string): Promise<string | null> {
  const url = "https://aimusic.one/api/v3/lyrics/generator";
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    Referer: "https://aimusic.one/ai-lyrics-generator"
  };
  
  const data = {
    description: prompt,
    style: "Auto",
    topic: "Auto",
    mood: "Auto",
    lan: "auto",
    isPublic: true
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result.lyrics || "No lyrics generated.";
  } catch (error) {
    console.error("Error in AimusicLyrics:", error);
    return "There was an error generating the lyrics.";
  }
}

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /aimusiclyrics diikuti dengan deskripsi lagu yang ingin dibuat.',
  tags: 'ai',
  command: /^aimusiclyrics$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const lyrics = await AimusicLyrics(prompt);

      if (lyrics) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Lirik lagu yang dihasilkan: \n${lyrics}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat memproses permintaan lirik lagu."
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

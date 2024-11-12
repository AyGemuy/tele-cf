import fetch from "node-fetch";

async function Ai4Chat(prompt: string) {
  const url = new URL("https://yw85opafq6.execute-api.us-east-1.amazonaws.com/default/boss_mode_15aug");
  url.search = new URLSearchParams({
    text: prompt,
    country: "Asia",
    user_id: "IWgCVHgf4N"
  }).toString();

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.ai4chat.co/pages/riddle-generator"
      }
    });

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return JSON.parse(await response.text());
  } catch (error) {
    console.error(error);
    return { success: false, errors: [error.message] };
  }
}

export default {
  help: 'Gunakan /ai4chat diikuti dengan prompt untuk mendapatkan jawaban.',
  tags: 'ai',
  command: /^ai4chat$/i,
  run: async function ({ prompt, chatId, tg }: { prompt: string; chatId: number; tg: any }) {
    try {
      const response = await Ai4Chat(prompt);

      if (response && response.success) {
        return await tg.sendMessage({
          chat_id: chatId,
          text: response.answer || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        return await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan dalam mendapatkan jawaban."
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

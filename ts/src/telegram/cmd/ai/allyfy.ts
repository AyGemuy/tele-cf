import fetch from "node-fetch";

// Function to interact with Allyfy Chat API
async function AllyfyChat(content: string): Promise<string | null> {
  try {
    const url = "https://chatbot.allyfy.chat/api/v1/message/stream/super/chat";
    const headers = {
      Accept: "text/event-stream",
      "Accept-Language": "en-US,en;q=0.9",
      "Content-Type": "application/json;charset=utf-8",
      DNT: "1",
      Origin: "https://www.allyfy.chat",
      Priority: "u=1, i",
      Referer: "https://www.allyfy.chat/",
      Referrer: "https://www.allyfy.chat",
      "Sec-CH-UA": '"Not/A)Brand";v="8", "Chromium";v="126"',
      "Sec-CH-UA-Mobile": "?0",
      "Sec-CH-UA-Platform": '"Linux"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    };

    const body = JSON.stringify({
      messages: [{
        content: content,
        role: "user"
      }],
      content: content,
      baseInfo: {
        clientId: "q08kdrde1115003lyedfoir6af0yy531",
        pid: "38281",
        channelId: "100000",
        locale: "en-US",
        localZone: 180,
        packageName: "com.cch.allyfy.webh"
      }
    });

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const result = data.trim().split("\n").map(line => {
      const json = line.slice(5);
      try {
        return JSON.parse(json).content;
      } catch {
        return null;
      }
    }).filter(Boolean).join("");

    return result;
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
  help: 'Gunakan /allyfy diikuti dengan pesan untuk berbicara dengan Allyfy AI.',
  tags: 'ai',
  command: /^allyfy$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const chatResponse = await AllyfyChat(prompt);

      if (chatResponse) {
        await tg.sendMessage({
          chat_id: chatId,
          text: chatResponse || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Allyfy AI."
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

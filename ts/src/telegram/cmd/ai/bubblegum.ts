import fetch from "node-fetch";

// Function to interact with Bubblegum API
async function Bubblegum(prompt: string, style: string = "Creative", invoice: number = 0): Promise<any | null> {
  try {
    const sign = await (await fetch("https://effulgent-bubblegum-e2f5df.netlify.app/api/create")).json();
    
    const response = await fetch("https://effulgent-bubblegum-e2f5df.netlify.app/api/sydney", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        conversationId: sign?.conversationId,
        encryptedconversationsignature: sign?.encryptedconversationsignature,
        clientId: sign?.clientId,
        invocationId: invoice,
        conversationStyle: style,
        prompt: prompt
      })
    });

    const jsonString = await response.text();
    const responses = jsonString.split("").map(s => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    }).filter(v => v?.item) || [];

    const json = responses[0];
    return json?.item.messages.filter(e => e.messageType === "Chat").reverse()[0] ||
           json?.item.messages.filter(e => e.author === "bot" && e.adaptiveCards[0]?.body[0]?.type === "TextBlock").reverse()[0];
  } catch (error) {
    console.error("Error in Bubblegum:", error);
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
  help: 'Gunakan /bubblegum diikuti dengan pesan untuk berbicara dengan Bubblegum AI.',
  tags: 'ai',
  command: /^bubblegum$/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const bubblegumResponse = await Bubblegum(prompt);

      if (bubblegumResponse && bubblegumResponse.text) {
        await tg.sendMessage({
          chat_id: chatId,
          text: bubblegumResponse.text || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi Bubblegum AI."
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

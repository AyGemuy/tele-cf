import axios from "axios";

function userAgent() {
  const androidVersions = ["4.0.3", "4.1.1", "4.2.2", "4.3", "4.4", "5.0.2", "5.1", "6.0", "7.0", "8.0", "9.0", "10.0", "11.0"],
    deviceModels = ["M2004J19C", "S2020X3", "Xiaomi4S", "RedmiNote9", "SamsungS21", "GooglePixel5"],
    buildVersions = ["RP1A.200720.011", "RP1A.210505.003", "RP1A.210812.016", "QKQ1.200114.002", "RQ2A.210505.003"],
    selectedModel = deviceModels[Math.floor(Math.random() * deviceModels.length)],
    selectedBuild = buildVersions[Math.floor(Math.random() * buildVersions.length)],
    chromeVersion = `Chrome/${Math.floor(80 * Math.random()) + 1}.${Math.floor(999 * Math.random()) + 1}.${Math.floor(9999 * Math.random()) + 1}`;
  return `Mozilla/5.0 (Linux; Android ${androidVersions[Math.floor(Math.random() * androidVersions.length)]}; ${selectedModel} Build/${selectedBuild}) AppleWebKit/537.36 (KHTML, like Gecko) ${chromeVersion} Mobile Safari/537.36 WhatsApp/1.${Math.floor(9 * Math.random()) + 1}.${Math.floor(9 * Math.random()) + 1}`;
}

async function TalkAI(message: string, type = "chat") {
  try {
    const headers = {
      "User-Agent": userAgent(),
      Referer: "https://talkai.info/id/chat/",
      "X-Forwarded-For": `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    };

    const data = {
      temperature: 0.5,
      frequency_penalty: 0,
      type: type,
      messagesHistory: [
        {
          from: "chatGPT",
          content: "Saya AI dari OpenAI, diciptakan untuk membantu Anda mengeksplorasi ide, bertukar informasi, dan menyelesaikan masalah. Ada yang bisa saya bantu?"
        },
        {
          from: "you",
          content: message
        }
      ],
      message: message
    };

    const response = await axios.post("https://talkai.info/id/chat/send/", data, { headers });
    return response.data || (await axios.post("https://talkai.info/id/chat/send2/", data, { headers })).data;

  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    throw new Error("Error occurred in TalkAI");
  }
}

export default {
  help: 'Gunakan /talkai diikuti dengan pesan untuk berbicara dengan AI.',
  tags: 'ai',
  command: /^talkai$/i,
  run: async function ({ prompt, chatId, tg }: { prompt: string; chatId: number; tg: any }) {
    try {
      const response = await TalkAI(prompt);
      
      if (response) {
        return await tg.sendMessage({
          chat_id: chatId,
          text: response || "Tidak ada jawaban yang ditemukan."
        });
      } else {
        return await tg.sendMessage({
          chat_id: chatId,
          text: "Terjadi kesalahan saat menghubungi AI."
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

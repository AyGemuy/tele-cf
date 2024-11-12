import fetch from "node-fetch";
import * as cheerio from "cheerio";

class TTSave {
  async down(videoUrl: string) {
    try {
      const response = await fetch("https://ttsave.app/download", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: "https://ttsave.app/id"
        },
        body: JSON.stringify({
          query: videoUrl,
          language_id: "2"
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const html = await response.text();
      const $ = cheerio.load(html);

      return {
        id: $("#unique-id").val(),
        name: $("h2.font-extrabold.text-xl").text(),
        avatar: $("a img").attr("src"),
        username: $("a.font-extrabold.text-blue-400").text(),
        bio: $("p.text-gray-600").text(),
        stats: {
          views: $("svg.text-gray-500 + span").first().text(),
          likes: $("svg.text-red-500 + span").text(),
          comments: $("svg.text-green-500 + span").text(),
          shares: $("svg.text-yellow-500 + span").text(),
          saves: $("svg.text-blue-500 + span").text()
        },
        sound: $("svg.text-gray-600 + span").text(),
        downloadLinks: {
          ...Object.fromEntries(
            $("a")
              .get()
              .map(a => [a.attribs.type, $(a).attr("href")])
              .filter(([type, href]) => type && href && href.trim() !== "")
          )
        }
      };
    } catch (error) {
      console.error("Error in TTSave down:", error);
      throw error;
    }
  }
}

const ttsave = new TTSave();

const ttSave = async (videoUrl: string) => {
  try {
    return await ttsave.down(videoUrl);
  } catch (error) {
    console.error("Error during download:", error);
    throw error;
  }
};

// Command handler interface
interface CommandHandlerProps {
  prompt: string; // URL of the video from the user
  chatId: string; // The chat ID for sending messages
  tg: any; // Telegram bot object (or similar bot API)
}

// Command handler for /ttsave command
export default {
  help: 'Gunakan /ttsave diikuti dengan URL video TikTok untuk mendapatkan informasi file.',
  tags: 'download',
  command: /^ttsave$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      // Call ttSave function with the provided prompt (video URL)
      const result = await ttSave(prompt);

      // Check if there is an error in the result
      if (!result || result.error) {
        await tg.sendMessage({
          chat_id: chatId,
          text: result?.error || "Terjadi kesalahan saat memproses permintaan."
        });
        return;
      }

      // Construct the response message with video information
      const message = `
📹 *Video Title:* ${result.name || "N/A"}
👤 *Username:* ${result.username || "N/A"}
📝 *Bio:* ${result.bio || "N/A"}
👁️ *Views:* ${result.stats.views || "N/A"}
❤️ *Likes:* ${result.stats.likes || "N/A"}
💬 *Comments:* ${result.stats.comments || "N/A"}
🔄 *Shares:* ${result.stats.shares || "N/A"}
💾 *Saves:* ${result.stats.saves || "N/A"}
🎵 *Sound:* ${result.sound || "N/A"}
🔗 *Download Links:*
${Object.entries(result.downloadLinks)
  .map(([type, link]) => `- ${type}: ${link}`)
  .join("\n")}
      `;

      // Send the message with the video information to the user
      await tg.sendMessage({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      });
    } catch (error) {
      console.error("Error in /ttsave command handler:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: "Terjadi kesalahan saat memproses permintaan."
      });
    }
  }
};

import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Define the structure for the media details
interface MediaDetails {
  text: string;
  url: string;
  quality: string;
}

// Define the class for TikTokIO handling
class TikTokIO {
  async down(videoUrl: string): Promise<{ medias: MediaDetails[] }> {
    try {
      // Make POST request to TikTokIO API with video URL
      const response = await fetch("https://tiktokio.com/api/v1/tk-htmx", {
        method: "POST",
        headers: {
          "HX-Request": "true",
          "HX-Trigger": "search-btn",
          "HX-Target": "tiktok-parse-result",
          "HX-Current-URL": "https://tiktokio.com/id/",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: "https://tiktokio.com/id/"
        },
        body: new URLSearchParams({
          prefix: "dtGslxrcdcG9raW8uY29t",
          vid: videoUrl
        })
      });

      // Check if the response was successful
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Parse the HTML response from TikTokIO API
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract media details from the page
      const results = $(".tk-down-link a").map((_, el) => {
        const $el = $(el);
        return {
          text: $el.text(),
          url: $el.attr("href"),
          quality: $el.text().includes("(HD)") ? "HD" : "Normal"
        };
      }).get().filter(v => v.url.startsWith("https"));

      // Return media details
      return {
        medias: results
      };
    } catch (error) {
      console.error("Error in TikTokIO down:", error);
      throw error;
    }
  }
}

// Instantiate TikTokIO class
const tikTokIO = new TikTokIO();

// Function to handle TikTokIO download
const tiktokio = async (videoUrl: string): Promise<{ medias: MediaDetails[] }> => {
  try {
    return await tikTokIO.down(videoUrl);
  } catch (error) {
    console.error('Error during download:', error);
    throw error;
  }
};

// Command handler interface for bot integration (adapt based on bot framework)
interface CommandHandlerProps {
  prompt: string; // URL of the video from the user
  chatId: string; // The chat ID for sending messages
  tg: any; // Telegram bot object (or similar bot API)
}

// Command handler for /tiktokio
export default {
  help: 'Gunakan /tiktokio diikuti dengan URL video untuk mendapatkan informasi file.',
  tags: 'download',
  command: /^tiktokio$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const videoInfo = await tiktokio(videoUrl);

      if (videoInfo && videoInfo.medias.length > 0) {
        // Send the video info as a message
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi file dari TikTokIO:
- Nama File: ${videoInfo.medias[0].text}
- URL: ${videoInfo.medias[0].url}
- Kualitas: ${videoInfo.medias[0].quality}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Error: Gagal mendapatkan informasi dari TikTokIO!`
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

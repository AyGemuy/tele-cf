import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Define the structure for video details
interface VideoDetails {
  thumbnail: string;
  title: string;
  downloadLinks: { text: string; link: string }[];
}

// Define class for TikTok video download handling
class TikVid {
  async down(videoUrl: string): Promise<VideoDetails[] | null> {
    try {
      // Make POST request to TikVid API with video URL
      const response = await fetch("https://tikvid.io/api/ajaxSearch", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "*/*",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: "https://tikvid.io/id"
        },
        body: new URLSearchParams({
          q: videoUrl,
          lang: "id"
        })
      });

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response from TikVid API
      const result = await response.json();
      const $ = cheerio.load(result.data);

      // Extract video details from HTML structure
      return $(".video-data").map((i, el) => {
        const thumbnail = $(el).find(".image-tik img").attr("src") || "No thumbnail";
        const title = $(el).find(".content h3").text().trim() || "No title";
        const downloadLinks = $(el).find(".dl-action a").map((i, em) => {
          const link = $(em).attr("href") || "";
          return link ? {
            text: $(em).text().trim() || "No text",
            link: link || "No URL"
          } : null;
        }).get().filter(Boolean);

        // Only return download links if found
        return downloadLinks.length ? {
          thumbnail: thumbnail,
          title: title,
          downloadLinks: downloadLinks
        } : null;
      }).get().filter(Boolean);
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  }
}

// Instantiate TikVid class
const tikVid = new TikVid();

// Function to handle TikTok download
const tikvid = async (videoUrl: string): Promise<VideoDetails[] | null> => {
  try {
    return await tikVid.down(videoUrl);
  } catch (error) {
    console.error('Error during download:', error);
    throw error;
  }
};

// Command handler interface
interface CommandHandlerProps {
  prompt: string;
  chatId: string;
  tg: any; // Assuming 'tg' is a Telegram bot object or similar
}

export default {
  help: 'Gunakan /tikvid diikuti dengan URL video TikTok untuk mendapatkan informasi video.',
  tags: 'download',
  command: /^tikvid$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const videoInfo = await tikvid(videoUrl);

      if (videoInfo && videoInfo.length > 0) {
        // Send the video info as a message
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi video TikTok:
- Judul Video: ${videoInfo[0].title}
- Thumbnail: ${videoInfo[0].thumbnail}
- Download Links: ${videoInfo[0].downloadLinks.map(link => link.link).join("\n")}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Error: Gagal mendapatkan informasi video dari TikTok!`
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

// Command handler interface
interface CommandHandlerProps {
  prompt: string;
  chatId: string;
  tg: any; // Assuming 'tg' is a Telegram bot object or similar
}

import axios from "axios";
import * as cheerio from "cheerio";

// AioDown class to fetch and filter media data
class AioDown {
  private url: string;
  private headers: Record<string, string>;
  private cookies: string;

  constructor() {
    this.url = "https://aiodown.com/wp-json/aio-dl/video-data/";
    this.headers = {
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://aiodown.com",
      referer: "https://aiodown.com/",
      "user-agent": "Postify/1.0.0",
      "X-Forwarded-For": new Array(4).fill(0).map(() => Math.floor(Math.random() * 256)).join("."),
    };
    this.cookies = "";
  }

  async getToken() {
    try {
      const response = await axios.get("https://aiodown.com");
      const $ = cheerio.load(response.data);
      const token = $("#token").val();
      if (token) {
        return token;
      } else {
        throw new Error("Token tidak ditemukan, coba lagi!");
      }
    } catch (error) {
      console.error("Gagal mengambil token:", error.message);
      throw error;
    }
  }

  generateHash(url: string, additional: string): string {
    try {
      return Buffer.from(url).toString("base64") + (url.length + 1e3) + Buffer.from(additional).toString("base64");
    } catch (error) {
      console.error("Gagal membuat hash:", error.message);
      throw error;
    }
  }

  async requestMediaData(videoUrl: string) {
    const maxRetries = 5;
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        const token = await this.getToken();
        const hash = this.generateHash(videoUrl, "aio-dl");
        const response = await axios.post(this.url, new URLSearchParams({
          url: videoUrl,
          token: token,
          hash: hash,
        }), {
          headers: {
            ...this.headers,
            cookie: this.cookies,
          },
        });
        const newCookies = response.headers["set-cookie"];
        if (newCookies) {
          this.cookies = newCookies.join("; ");
        }
        return response.data;
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes("Rate limit exceeded")) {
          console.log("Batas permintaan API terlampaui, mencoba ulang...");
          retryCount++;
        } else {
          console.error("Gagal mengambil data media:", error.response ? error.response.data : error.message);
          throw error;
        }
      }
    }
    throw new Error("Terlalu banyak permintaan, coba lagi nanti.");
  }

  filterQuality(medias: { quality: string; url: string }[], desiredQuality: string): string | null {
    try {
      const media = medias.find(media => media.quality === desiredQuality);
      return media ? media.url : null;
    } catch (error) {
      console.error("Gagal memfilter kualitas media:", error.message);
      throw error;
    }
  }

  async getDownloadLinks(videoUrl: string, desiredQuality: string = "360p") {
    try {
      const data = await this.requestMediaData(videoUrl);
      const mediaUrls = new Array(...data.medias.map(media => ({
        quality: media.quality,
        url: media.url,
      })));
      const downloadLink = this.filterQuality(mediaUrls, desiredQuality);
      return {
        mediaUrls: mediaUrls,
        downloadLink: downloadLink,
      };
    } catch (error) {
      console.error("Gagal mendapatkan link download:", error.message);
      throw error;
    }
  }
}

// Create instance of AioDown class
const aioDown = new AioDown();

// A helper function to fetch download links
const aiodown = async (videoUrl: string, desiredQuality: string = "360p") => {
  return await aioDown.getDownloadLinks(videoUrl, desiredQuality);
};

// Command handler for the Telegram bot
export default {
  help: 'Gunakan /aiodown diikuti dengan URL video untuk mendapatkan link download.',
  tags: 'download',
  command: /^aiodown$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const { downloadLink, mediaUrls } = await aiodown(videoUrl);

      if (downloadLink) {
        let message = `Download link untuk video:\n${downloadLink}\n\nKualitas tersedia:\n`;
        mediaUrls.forEach((media) => {
          message += `- ${media.quality}: ${media.url}\n`;
        });
        await tg.sendMessage({
          chat_id: chatId,
          text: message,
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Tidak dapat menemukan link download untuk video ini.",
        });
      }
    } catch (error) {
      console.error('Error during run command:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message,
      });
    }
  }
};

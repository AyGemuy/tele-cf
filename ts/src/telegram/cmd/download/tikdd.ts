import axios from "axios";
import * as cheerio from "cheerio";

// Define interface for TikTok download response
interface TikTokResponse {
  videoUrl: string;
  thumbnailUrl: string;
  videoTitle: string;
  size: string;
}

// TikTok download class
class TikDD {
  private url: string;
  private headers: Record<string, string>;

  constructor() {
    this.url = "https://www.tikdd.cc/wp-json/aio-dl/video-data/";
    this.headers = {
      accept: "*/*",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://www.tikdd.cc",
      referer: "https://www.tikdd.cc/",
      "user-agent": "Postify/1.0.0",
      cookie: "pll_language=en",
      "x-forwarded-for": Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".")
    };
  }

  async token(): Promise<string> {
    const { data } = await axios.get("https://www.tikdd.cc");
    const $ = cheerio.load(data);
    const token = $("#token").val();
    if (!token) throw new Error("Tokennya gak ada 😆");
    return token;
  }

  urlHash(url: string): string {
    return btoa(url) + (url.length + 1e3) + btoa("aio-dl");
  }

  async down(videoUrl: string): Promise<TikTokResponse> {
    const token = await this.token();
    const hash = this.urlHash(videoUrl);
    const response = await axios.post(this.url, new URLSearchParams({
      url: videoUrl,
      token: token,
      hash: hash
    }), {
      headers: this.headers
    });
    return response.data;
  }
}

// TikTok download function
const Tikdd = async (videoUrl: string): Promise<TikTokResponse | undefined> => {
    try {
        const data = await new TikDD().down(videoUrl);
        return data ? {
          videoUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          videoTitle: data.videoTitle,
          size: data.size
        } : undefined;
    } catch (error) {
        console.error('Error during download:', error);
        throw error;
    }
};

// Command handler for /tikdd
interface CommandHandlerProps {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /tikdd diikuti dengan URL video TikTok untuk mendapatkan informasi video.',
  tags: 'download',
  command: /^tikdd$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const videoInfo = await Tikdd(videoUrl);

      if (videoInfo) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi video TikTok:
- Judul Video: ${videoInfo.videoTitle}
- Ukuran Video: ${videoInfo.size}
- URL Video: ${videoInfo.videoUrl}
- Thumbnail: ${videoInfo.thumbnailUrl}`
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

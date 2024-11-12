import fetch from 'node-fetch';

interface VideoInfo {
  success: boolean;
  provider: string;
  data?: string;
}

class TiktokJs {
  private apiUrl: string;
  private providers: string[];

  constructor() {
    this.apiUrl = "https://tiktokjs-downloader.vercel.app/api/v1/";
    this.providers = [
      "aweme", "musicaldown", "savetik", "snaptik", "snaptikpro",
      "ssstik", "tikcdn", "tikmate", "tiktokdownloadr", "tikwm", "ttdownloader"
    ];
  }

  private async fetchData(tiktok: string, endpoint: string, method: 'POST' | 'GET' = 'POST'): Promise<any> {
    const url = `${this.apiUrl}${endpoint}${method === "GET" ? `?url=${encodeURIComponent(tiktok)}` : ""}`;
    const options: RequestInit = {
      method,
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json"
      },
      body: method === "POST" ? JSON.stringify({ url: tiktok }) : null
    };

    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`Error: ${response.status} - ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(error.message);
      return method === "POST" ? await this.fetchData(tiktok, endpoint, "GET") : Promise.reject(error);
    }
  }

  public async fetchByProvider(link: string, index: number = 0): Promise<VideoInfo | null> {
    const provider = this.providers[index] || this.providers[0];
    const response = await this.fetchData(link, provider);
    if (response.success) {
      return {
        success: true,
        provider: provider,
        data: response.data || "No data available"
      };
    }
    return null;
  }

  public displayEndpoints(): string[] {
    return this.providers;
  }
}

const tiktokjs = async (link: string, index: number = 0): Promise<VideoInfo | null> => {
  const tiktok = new TiktokJs();
  return await tiktok.fetchByProvider(link, index);
};

// Command handler
interface CommandHandlerProps {
  prompt: string;
  chatId: string;
  tg: any; // Assuming 'tg' is a Telegram bot object or similar
}

export default {
  help: 'Gunakan /tiktokjs diikuti dengan URL TikTok dan optional index untuk memilih provider (misalnya: /tiktokjs <URL> 2).',
  tags: 'download',
  command: /^tiktokjs$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const [url, index] = prompt.split(' ');
      const providerIndex = index ? parseInt(index, 10) : 0;

      const videoInfo = await tiktokjs(url, providerIndex);

      if (videoInfo && videoInfo.success) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi video TikTok dari provider ${videoInfo.provider}:\n\n${videoInfo.data}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Error: Gagal mendapatkan informasi video TikTok!`
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

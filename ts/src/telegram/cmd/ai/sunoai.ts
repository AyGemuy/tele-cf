import fetch from "node-fetch";

// SunoAi class definition
class SunoAi {
  apiKey: string[];
  endpoint: string;
  headers: Record<string, string>;

  constructor() {
    this.apiKey = ["VCwrNNJ1msu3dOQmGr46AM3WLxoecqLl", "bw0f/AFAdYQ3QVX3ZkM9ZrnncYH/iCRl"];
    this.endpoint = "https://api.sunoaiapi.com/api/v1/";
    this.headers = {
      "api-key": this.apiKey[0],
      "Content-Type": "application/json"
    };
  }

  // Method to create a music task
  async createMusicTask({
    title = "",
    tags = [],
    prompt = "",
    model
  }: { title: string, tags: string[], prompt: string, model: string }) {
    try {
      const data = {
        title: title,
        tags: Array.isArray(tags) ? tags.join(",") : tags,
        prompt: prompt,
        mv: model
      };
      const response = await fetch(this.endpoint + "/gateway/generate/music", {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { error: `HTTP ${error.message}` };
    }
  }

  // Method to query the result of the music task
  async queryResult(ids: string[]) {
    try {
      const response = await fetch(`${this.endpoint}/gateway/query?ids=${ids.join(",")}`, {
        method: "GET",
        headers: this.headers
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { error: `HTTP ${error.message}` };
    }
  }

  // Method to generate music using the prompt, title, tags, and model
  async generateMusic(prompt = "", title = "", tags = [], model = "chirp-v3-5") {
    try {
      const tasks = await this.createMusicTask({
        title: title,
        tags: tags,
        prompt: prompt,
        model: model
      });

      const ids = tasks?.data?.map((task: any) => task.song_id);
      let allResolved = false;
      const timeout = Date.now() + 12e4;  // 2 minutes timeout

      while (!allResolved && Date.now() < timeout) {
        const results = await this.queryResult(ids);
        if (results.length) {
          allResolved = results[0]?.status === "complete";
        }
        if (allResolved) return results;
        await new Promise(resolve => setTimeout(resolve, 2000));  // 2 seconds polling
      }

      return { error: "Poling timeout. Coba lagi nanti." };
    } catch (error) {
      return { error: `HTTP ${error.message}` };
    }
  }
}

// Instantiate the SunoAi class
const sunoAi = new SunoAi();

// Function to handle music generation request
const suno = async (prompt = "", title = "", tags = [], model = "chirp-v3-5") => {
  return await sunoAi.generateMusic(prompt, title, tags, model);
};

// Telegram Bot Command Handler
interface CommandContext {
  prompt: string;
  title: string;
  tags: string[];
  model: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan perintah /sunoai diikuti dengan prompt, judul, dan tag untuk menghasilkan musik AI.',
  tags: 'ai',
  command: /^sunoai$/i,
  run: async function ({ prompt, title, tags, model, chatId, tg }: CommandContext): Promise<void> {
    try {
      const musicResponse = await suno(prompt, title, tags, model);

      if (musicResponse.error) {
        await tg.sendMessage({
          chat_id: chatId,
          text: musicResponse.error
        });
      } else {
        const musicLink = musicResponse.data[0]?.song_url || "Tidak ada hasil yang ditemukan.";
        await tg.sendMessage({
          chat_id: chatId,
          text: `Musik yang dihasilkan: ${musicLink}`
        });
      }
    } catch (error) {
      console.error("Error during Suno AI music generation:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

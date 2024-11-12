import fetch from "node-fetch";

// Ddownr function for video downloading
async function Ddownr(videoUrl: string, format: string = "360"): Promise<ProgressResponse | null> {
  const apiUrl = "https://ab.cococococ.com/ajax/download.php";
  const progressUrl = "https://p.oceansaver.in/ajax/progress.php";
  const apiKey = "dfcb6d76f2f6a9894gjkege8a4ab232222";
  const timeout = 60000; // 60 seconds
  const interval = 2000; // 2 seconds

  try {
    const res = await fetch(
      `${apiUrl}?copyright=0&format=${format}&url=${encodeURIComponent(videoUrl)}&api=${apiKey}`
    );
    const { id, success }: DownloadResponse = await res.json();

    if (!success || !id) throw new Error("Failed to initiate download");

    const start = Date.now();
    while (Date.now() - start < timeout) {
      const progressRes = await fetch(`${progressUrl}?id=${id}`);
      const progress: ProgressResponse = await progressRes.json();

      if (progress.success && progress.download_url) {
        return progress;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Download timeout exceeded");
  } catch (error) {
    console.error("Error in Ddownr:", error.message);
    return null;
  }
}

// Types for responses
interface DownloadResponse {
  id: string;
  success: boolean;
}

interface ProgressResponse {
  success: boolean;
  download_url?: string;
}

// Command handler properties
interface CommandHandlerProps {
  prompt: string; // URL of the video from the user
  chatId: string; // The chat ID for sending messages
  tg: any; // Telegram bot object (or similar bot API)
}

// Command handler for /ddownr
export default {
  help: 'Gunakan /ddownr diikuti dengan URL video untuk mendownload video.',
  tags: 'download',
  command: /^ddownr$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const format = "360"; // Default format for video download

      const downloadResult = await Ddownr(videoUrl, format);

      if (downloadResult && downloadResult.download_url) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Video berhasil di-download! Link: ${downloadResult.download_url}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Gagal untuk memulai proses download. Coba lagi dengan URL yang valid."
        });
      }
    } catch (error) {
      console.error("Error during /ddownr command:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

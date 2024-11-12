import fetch from "node-fetch";

// Define the structure for the media details
interface MediaDetails {
  text: string;
  url: string;
  quality: string;
}

// Define the class for TestTerabox handling
class TestTerabox {
  async down(videoUrl: string): Promise<{ medias: MediaDetails[] }> {
    try {
      // Make POST request to TestTerabox API with video URL
      const response = await fetch("https://testterabox.vercel.app/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
          Referer: "https://teraboxdownloader.online/"
        },
        body: JSON.stringify({
          url: videoUrl
        })
      });

      // Check if the response was successful
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      // Parse the JSON response from TestTerabox API
      const json = await response.json();

      // Return media details in the expected format
      return {
        medias: [{
          text: json.file_name,
          url: json.direct_link,
          quality: json.size
        }]
      };
    } catch (error) {
      console.error("Error in TestTerabox down:", error);
      throw error;
    }
  }
}

// Instantiate the TestTerabox class
const testtera = new TestTerabox();

// Function to handle TestTerabox download
const testterabox = async (videoUrl: string): Promise<{ medias: MediaDetails[] }> => {
  try {
    return await testtera.down(videoUrl);
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

// Command handler for /testterabox
export default {
  help: 'Gunakan /testterabox diikuti dengan URL video untuk mendapatkan informasi file.',
  tags: 'download',
  command: /^testterabox$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const videoUrl = prompt;
      const videoInfo = await testterabox(videoUrl);

      if (videoInfo && videoInfo.medias.length > 0) {
        // Send the video info as a message
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi file dari TestTerabox:
- Nama File: ${videoInfo.medias[0].text}
- URL: ${videoInfo.medias[0].url}
- Kualitas: ${videoInfo.medias[0].quality}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Error: Gagal mendapatkan informasi dari TestTerabox!`
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

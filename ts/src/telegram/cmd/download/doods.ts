import crypto from "crypto";
import * as cheerio from "cheerio";
import fetch from "node-fetch";

const Doods = async (url: string) => {
  try {
    const proxyLink = "https://rv.lil-hacker.workers.dev/proxy?mirror=dood&url=";
    const headers = {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      Referer: "https://d000d.com/",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Mobile Safari/537.36"
    };

    const idm = url.match(/\/[de]\/([a-zA-Z0-9]+)/);
    if (!idm) {
      throw new Error("Link nya gak bisa diproses bree, ganti link yang baru aja");
    }
    const id = idm[1];
    const base = "https://dood.li/d/";
    const doodstreamUrl = `${proxyLink}https://d000d.com/e/${id}`;
    await new Promise(resolve => setTimeout(resolve, 14000));

    let response = await fetch(`${base}${id}`);
    let data = await response.text();
    let $ = cheerio.load(data);

    if ($("#os_player iframe").length === 0) {
      return {};
    }

    const result = {
      title: $(".title-wrap h4").text().trim(),
      duration: $(".length").text().trim(),
      size: $(".size").text().trim(),
      uploadDate: $(".uploadate").text().trim(),
    };

    response = await fetch(doodstreamUrl, { headers });
    if (!response.ok) return `Error: Unable to fetch Doodstream page, status code: ${response.status}`;

    let text = await response.text();
    const urlInsideGet = text.match(/\$.get\('([^']+)',\s*function\(data\)/)?.[1];
    if (!urlInsideGet) return "Error: Unable to find URL inside the initial response.";

    const lastValue = urlInsideGet.match(/\/([^/]+)$/)?.[1];
    const newUrl = `${proxyLink}https://d000d.com${urlInsideGet}`;

    response = await fetch(newUrl, { headers });
    if (!response.ok) return "Error: Unable to fetch contents of the secondary URL.";

    const part1 = await response.text();
    const randomString = Array.from(crypto.randomFillSync(new Uint8Array(10)))
      .map(x => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[x % 62])
      .join("");

    result["finalLink"] = `${proxyLink}${part1}${randomString}?token=${lastValue}&expiry=${Date.now()}`;
    return result;
  } catch (error) {
    console.error(error);
    return {
      error: "Terjadi kesalahan saat scraping...",
    };
  }
};

interface CommandHandlerProps {
  prompt: string; // URL of the video from the user
  chatId: string; // The chat ID for sending messages
  tg: any; // Telegram bot object (or similar bot API)
}

// Command handler for /doods command
export default {
  help: 'Gunakan /doods diikuti dengan URL video untuk mendapatkan informasi file dari Doodstream.',
  tags: 'download',
  command: /^doods$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      // Call Doods function with the provided prompt (URL)
      const result = await Doods(prompt);

      // Check if there's an error in the result
      if (result.error) {
        await tg.sendMessage({
          chat_id: chatId,
          text: result.error,
        });
        return;
      }

      // Construct response message with video details
      const message = `
🎬 *Title:* ${result.title || "N/A"}
🕒 *Duration:* ${result.duration || "N/A"}
📦 *Size:* ${result.size || "N/A"}
📅 *Upload Date:* ${result.uploadDate || "N/A"}
🔗 *Download Link:* ${result.finalLink || "Link tidak tersedia"}
      `;

      // Send message to user with the video information
      await tg.sendMessage({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Error in /doods command handler:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  },
};

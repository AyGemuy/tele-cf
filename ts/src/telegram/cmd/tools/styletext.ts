import fetch from "node-fetch";
import * as cheerio from "cheerio";
import _ from "lodash";

// Function to fetch and process text stylizations
const stylizeText = async (query: string) => {
  try {
    const response = await fetch(`http://qaz.wtf/u/convert.cgi?text=${encodeURIComponent(query)}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Process the response to extract stylized text options
    return _.chain($("table tr"))
      .map(row => {
        const cells = $(row).find("td");
        return cells.length > 1
          ? {
              name: $(cells[0]).find(".aname").text() || $(cells[0]).text(),
              value: $(cells[1]).html().trim()
            }
          : null;
      })
      .compact()
      .value();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error("Failed to fetch and process data");
  }
};

// Bot command for `/stylize`
export default {
  help: 'Gunakan perintah /stylize diikuti dengan teks untuk melihat berbagai gaya penulisan.',
  tags: 'tools',
  command: /^stylize$/i,
  run: async function ({ prompt, chatId, tg }: { prompt: string, chatId: string, tg: any }) {
    try {
      const query = prompt.trim();  // The text to be stylized
      
      // Fetch the stylized text data
      const result = await stylizeText(query);
      
      if (result.length === 0) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Tidak ada gaya penulisan yang ditemukan untuk: "${query}"`
        });
      } else {
        let replyText = `Berikut adalah berbagai gaya penulisan untuk: ${query}:\n\n`;
        
        result.forEach((item, idx) => {
          replyText += `${idx + 1}. ${item.name}: ${item.value}\n`;
        });
        
        await tg.sendMessage({
          chat_id: chatId,
          text: replyText
        });
      }
    } catch (error) {
      console.error('Error during /stylize command:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

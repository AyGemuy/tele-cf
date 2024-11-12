import axios from "axios";
import * as cheerio from "cheerio";

// Function to fetch the image and details of the distance between two places
async function jarak(from: string, to: string) {
  try {
    const query = `jarak ${from} ke ${to}`,
      { data } = await axios.get(`https://www.google.com/search?q=${encodeURIComponent(query)}&hl=id`),
      $ = cheerio.load(data),
      img = $('script:contains("var s=\'")').text().match(/var s='(.*?)'/)?.[1] || "", 
      imgData = /^data:.*?\/.*?;base64,/i.test(img) ? Buffer.from(img.split(",")[1], "base64") : null,
      [desc, rute] = $("div.kCrYT > span > div.BNeawe.deIvCb.AP7Wnd, div.kCrYT > span > div.BNeawe.tAd8D.AP7Wnd").toArray().map(el => $(el).text().trim());
    
    return {
      img: imgData,
      desc: desc.replace(/(Dari:|Ke:)/g, "- *$1*"),
      rute: rute
    };
  } catch (error) {
    throw console.error(error), "Terjadi kesalahan dalam menghitung jarak.";
  }
}

// Command Handler for /jarak
export default {
  help: 'Gunakan /jarak diikuti dengan dua lokasi untuk menghitung jarak dan melihat gambarnya.',
  tags: 'tools',
  command: /^jarak$/i,
  run: async function ({ prompt, chatId, tg }: { prompt: string, chatId: string, tg: any }) {
    try {
      const [from, to] = prompt.split('|').map(x => x.trim());  // Expect input like "Jakarta | Bandung"
      
      // Fetching distance and image data
      const { img, desc, rute } = await jarak(from, to);
      
      // Sending the response message with the description and route
      await tg.sendMessage({
        chat_id: chatId,
        text: `Jarak antara ${from} dan ${to}:
*Deskripsi:* ${desc}
*Rute:* ${rute}`
      });
      
      // Sending the image as a photo
      if (img) {
        await tg.sendPhoto({
          chat_id: chatId,
          photo: { source: img },  // Send the image as buffer
          caption: `Jarak antara ${from} dan ${to}`
        });
      }
    } catch (error) {
      console.error('Error during /jarak command:', error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

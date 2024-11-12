import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Define interface for MediaFire response
interface MediaFireResponse {
  link: string;
  alternativeUrl: string;
  name: string;
  filetype: string;
  mime: string;
  uploaded: string;
  size: string;
}

// MediaFire function to scrape media details
async function MediaFire(url: string): Promise<MediaFireResponse | undefined> {
  try {
    const data = await fetch(`https://www-mediafire-com.translate.goog/${url.replace('https://www.mediafire.com/', '')}?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en&_x_tr_pto=wapp`, { 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.178 Safari/537.36"
      } 
    }).then(res => res.text());

    const $ = cheerio.load(data);
    const downloadUrl = ($("#downloadButton").attr("href") || "").trim();
    const alternativeUrl = ($("#download_link > a.retry").attr("href") || "").trim();
    const $intro = $("div.dl-info > div.intro");
    const filename = $intro.find("div.filename").text().trim();
    const filetype = $intro.find("div.filetype > span").eq(0).text().trim();
    const ext = /\(\.(.*?)\)/.exec($intro.find("div.filetype > span").eq(1).text())?.[1]?.trim() || "bin";
    const uploaded = $("div.dl-info > ul.details > li").eq(1).find("span").text().trim();
    const filesize = $("div.dl-info > ul.details > li").eq(0).find("span").text().trim();

    return {
      link: downloadUrl || alternativeUrl,
      alternativeUrl: alternativeUrl,
      name: filename,
      filetype: filetype,
      mime: ext,
      uploaded: uploaded,
      size: filesize
    };
  } catch (error) {
    console.error(error);
  }
}

// Command handler for mediafire
interface CommandHandlerProps {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan /mediafire diikuti dengan URL MediaFire untuk mendapatkan informasi file.',
  tags: 'download',
  command: /^mediafire$/i,
  run: async function ({ prompt, chatId, tg }: CommandHandlerProps): Promise<void> {
    try {
      const fileInfo = await MediaFire(prompt);

      if (fileInfo) {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Berikut adalah informasi file dari MediaFire:
- Nama File: ${fileInfo.name}
- Tipe File: ${fileInfo.filetype}
- Ekstensi: ${fileInfo.mime}
- Ukuran: ${fileInfo.size}
- Diupload pada: ${fileInfo.uploaded}
- Link Download: ${fileInfo.link}
${fileInfo.alternativeUrl ? `Alternatif Link Download: ${fileInfo.alternativeUrl}` : ''}`
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: `Error: Gagal mendapatkan informasi file dari MediaFire!`
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

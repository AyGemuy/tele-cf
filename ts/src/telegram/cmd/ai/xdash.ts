import fetch from "node-fetch";

// AiXdash function
async function AiXdash(prompt: string) {
  try {
    const response = await fetch("https://www.xdash.ai/api/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.xdash.ai/search?q=" + prompt
      },
      body: JSON.stringify({
        query: prompt,
        search_uuid: "UeobIeXGOEB8MfdunbU9b",
        visitor_uuid: "6167835e06d725a1de2b09f24266c5e5",
        token: "U2FsdGVkX18zduZOiKyREqfQHMIddN0eIExQYnrxAJI="
      })
    });

    const splitAndFormat = input => {
      const [llm, related] = ["__LLM_RESPONSE__", "__RELATED_QUESTIONS__"].map(tag => input.indexOf(tag));
      return {
        answer: JSON.parse(input.slice(0, llm).trim()),
        llm: input.slice(llm + 16, related).replace(/\s*\[citation:\d+\]\s*/g, "").trim(),
        related: JSON.parse(input.slice(related + 21).trim())
      };
    };

    const cleanText = text => text.replace(/&[#A-Za-z0-9]+;/g, match => {
      const entities = {
        "&amp;": "&",
        "&#x27;": "'",
        "&quot;": '"',
        "&lt;": "<",
        "&gt;": ">",
        "&nbsp;": " ",
        "&apos;": "'",
        "&#39;": "'"
      };
      return entities[match] || match;
    });

    const formatOutput = ({
      answer,
      llm,
      related
    }) => [`${llm ?? ""}`, answer?.map(a => `*${a.name}*\n${cleanText(a.snippet)}\n🔗 ${a.url}`).join("\n\n") ?? "", `*Terkait:*\n${related?.map(r => `• ${r.question}`).join("\n") ?? ""}`].filter(Boolean).join("\n\n");

    return formatOutput(splitAndFormat(await response.text()));
  } catch (error) {
    console.error("Error:", error);
    return "Terjadi kesalahan saat mengambil informasi.";
  }
}

// Command handler for Telegram bot
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan perintah /xdash diikuti dengan pertanyaan untuk mencari informasi.',
  tags: 'ai',
  command: /^xdash/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const aiResponse = await AiXdash(prompt);

      if (aiResponse) {
        await tg.sendMessage({
          chat_id: chatId,
          text: aiResponse
        });
      } else {
        await tg.sendMessage({
          chat_id: chatId,
          text: "Tidak ada hasil ditemukan."
        });
      }
    } catch (error) {
      console.error("Error during AiXdash processing:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: error.message
      });
    }
  }
};

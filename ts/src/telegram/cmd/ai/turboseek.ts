import fetch from "node-fetch";

// Turboseek function
async function Turboseek(prompt: string) {
  try {
    const sourcesResponse = await fetch("https://www.turboseek.io/api/getSources", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.turboseek.io/",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: prompt
      })
    });
    const sources = await sourcesResponse.json();

    const similarQuestionsResponse = await fetch("https://www.turboseek.io/api/getSimilarQuestions", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.turboseek.io/",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: prompt
      })
    });
    const similarQuestions = await similarQuestionsResponse.json();

    const answerResponse = await fetch("https://www.turboseek.io/api/getAnswer", {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        Referer: "https://www.turboseek.io/",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: prompt,
        sources: sources
      })
    });
    const data = await answerResponse.text();
    const parsedChunks = data.split("\n").map(line => {
      try {
        return JSON.parse(line.slice(6)).text;
      } catch (e) {
        return "";
      }
    });
    const combinedAnswer = parsedChunks.join("").trim();
    const formattedSources = sources.map(source => `- [${source.name}](${source.url})`).join("\n");
    const formattedSimilarQuestions = similarQuestions.map(question => `- ${question}`).join("\n");

    const combinedOutput = `
      *Answer:*
      ${combinedAnswer}
      
      *Similar Questions:*
      ${formattedSimilarQuestions}
      
      *Sources:*
      ${formattedSources}
    `;
    return combinedOutput.trim();
  } catch (error) {
    console.error("Error:", error);
    return "Terjadi kesalahan saat memproses permintaan.";
  }
}

// Command handler for Telegram bot
interface CommandContext {
  prompt: string;
  chatId: number;
  tg: any;
}

export default {
  help: 'Gunakan perintah /turboseek diikuti dengan pertanyaan untuk mencari informasi.',
  tags: 'ai',
  command: /^turboseek/i,
  run: async function ({ prompt, chatId, tg }: CommandContext): Promise<void> {
    try {
      const aiResponse = await Turboseek(prompt);

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
      console.error("Error during Turboseek processing:", error);
      await tg.sendMessage({
        chat_id: chatId,
        text: "Terjadi kesalahan saat memproses permintaan Anda."
      });
    }
  }
};
